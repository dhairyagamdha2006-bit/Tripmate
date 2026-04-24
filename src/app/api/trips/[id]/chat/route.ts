import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { chatSchema } from '@/lib/validations/trip';
import { tripRepository } from '@/server/repositories/trip.repository';
import { agentMessageRepository } from '@/server/repositories/agent-message.repository';
import { aiService } from '@/server/services/ai.service';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const trip = await tripRepository.getTripForUser(params.id, session.user.id);
    if (!trip?.requests[0]) {
      return NextResponse.json({ ok: false, error: 'Trip not found.' }, { status: 404 });
    }

    if (!aiService.isConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error: 'AI provider is not configured. Set AI_PROVIDER plus OPENAI_API_KEY or ANTHROPIC_API_KEY.'
        },
        { status: 503 }
      );
    }

    const parsed = chatSchema.parse(await request.json());
    const tripRequest = trip.requests[0];

    await agentMessageRepository.create({
      tripRequestId: tripRequest.id,
      role: 'USER',
      type: 'QUESTION',
      content: parsed.message
    });

    const reply = await aiService.replyToTripChat({
      trip: {
        title: trip.title,
        origin: trip.originLabel,
        destination: trip.destinationLabel,
        departureDate: trip.departureDate.toISOString(),
        returnDate: trip.returnDate.toISOString(),
        budgetCents: tripRequest.budgetCents,
        currency: tripRequest.currency,
        travelerCount: tripRequest.travelerCount,
        notes: tripRequest.notes,
        bookingState: trip.bookings[0]?.status ?? null
      },
      packages: tripRequest.packages,
      history: tripRequest.agentMessages.map((message) => ({ role: message.role, content: message.content })),
      userMessage: parsed.message
    });

    const saved = await agentMessageRepository.create({
      tripRequestId: tripRequest.id,
      role: 'ASSISTANT',
      type: 'TEXT',
      content: reply
    });

    return NextResponse.json({ ok: true, message: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate AI response.';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
