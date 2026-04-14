import { jsonError, jsonOk, requireApiUser } from '@/server/http/route-helpers';
import { tripService } from '@/server/services/trip.service';
import { tripRepository } from '@/server/repositories/trip.repository';
import { checkRateLimit } from '@/lib/utils/rate-limit';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireApiUser();

  // Rate limit: 30 messages per user per hour
  const limited = await checkRateLimit(`chat:${user.id}`, 30, 3600);
  if (limited) {
    return jsonError('Too many messages. Please wait a moment.', 429);
  }

  const body = await request.json();
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return jsonError('Message is required.', 400);
  if (message.length > 1000) return jsonError('Message is too long.', 400);

  const trip = await tripService.getTripForUser(user.id, params.id);
  if (!trip) return jsonError('Trip not found.', 404);

  const request2 = trip.requests[0];
  const packages = request2?.packages ?? [];

  // Build context for the AI
  const tripContext = `
Trip: ${trip.title}
From: ${trip.originLabel} → ${trip.destinationLabel}
Dates: ${trip.departureDate.toLocaleDateString()} to ${trip.returnDate.toLocaleDateString()}
Travelers: ${trip.travelerCount}
Status: ${trip.status}
${packages.length > 0 ? `\nAvailable packages:\n${packages.map((p) =>
  `- ${p.label}: $${(p.totalPriceCents / 100).toFixed(0)} (score: ${p.overallScore})`
).join('\n')}` : ''}
`.trim();

  // If no OpenAI key, use a smart rule-based fallback
  if (!process.env.OPENAI_API_KEY) {
    const reply = getRuleBasedReply(message, tripContext);
    await saveMessages(request2?.id, message, reply);
    return jsonOk({ reply });
  }

  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const history = await tripRepository.getAgentMessages(request2?.id ?? '');
    const historyMessages = history.slice(-10).map((m) => ({
      role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
      content: m.content
    }));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Tripmate, a helpful travel assistant. You help users plan trips, understand their booking options, and make good travel decisions. Be concise, friendly, and specific. Always refer to the user's actual trip data.

Current trip context:
${tripContext}`
        },
        ...historyMessages,
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? 'I could not generate a response.';
    await saveMessages(request2?.id, message, reply);
    return jsonOk({ reply });
  } catch (err) {
    console.error('[chat] OpenAI error:', err);
    const reply = getRuleBasedReply(message, tripContext);
    await saveMessages(request2?.id, message, reply);
    return jsonOk({ reply });
  }
}

async function saveMessages(tripRequestId: string | undefined, userMsg: string, assistantMsg: string) {
  if (!tripRequestId) return;
  await tripRepository.createAgentMessage({
    tripRequestId,
    role: 'USER',
    type: 'TEXT',
    content: userMsg
  });
  await tripRepository.createAgentMessage({
    tripRequestId,
    role: 'ASSISTANT',
    type: 'TEXT',
    content: assistantMsg
  });
}

function getRuleBasedReply(message: string, context: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('cancel')) {
    return "To cancel your booking, go to your trip's booking review page and use the Cancel Booking button. Cancellations are subject to the policy shown at checkout.";
  }
  if (lower.includes('refund')) {
    return "Refunds depend on the fare type you selected. Fully refundable fares are returned to your original payment method within 5–10 business days.";
  }
  if (lower.includes('hotel') || lower.includes('stay')) {
    return "Your hotel options are scored on star rating, guest reviews, neighborhood, and price fit. Check the Recommendations tab to compare all options.";
  }
  if (lower.includes('flight') || lower.includes('fly')) {
    return "Flights are compared on price, duration, number of stops, and refundability. Direct flights score higher on convenience.";
  }
  if (lower.includes('best') || lower.includes('recommend')) {
    return `Based on your trip context:\n\n${context}\n\nThe Best Value package balances price fit, convenience, and hotel quality. Check your Recommendations page for full details.`;
  }
  return "I'm here to help with your trip planning. You can ask about flights, hotels, packages, cancellation policies, or anything else about your trip.";
}
