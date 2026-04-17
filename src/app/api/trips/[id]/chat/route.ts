import type { CoreMessage } from 'ai';

import { jsonError, jsonOk, requireApiUser } from '@/server/http/route-helpers';
import { tripRepository } from '@/server/repositories/trip.repository';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import {
  buildTripContext,
  isLikelyPromptInjection,
  persistChatExchange,
  resolveProvider,
  ruleBasedReply,
  streamTripChat
} from '@/server/services/ai.service';

export const runtime = 'nodejs';
// Streams can be long-lived — let Vercel keep the connection open.
export const maxDuration = 60;

/**
 * Trip assistant endpoint.
 *
 * If `stream=1` is set in the query string we return a `text/event-stream`
 * using the Vercel AI SDK. Otherwise we return a single JSON payload for
 * legacy callers. Every branch persists the exchange and applies
 * rate limiting and prompt-injection guards.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireApiUser();

  const limited = await checkRateLimit(`chat:${user.id}`, 30, 3600);
  if (limited) {
    return jsonError('Too many messages. Please wait a moment.', 429);
  }

  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return jsonError('Message is required.', 400);
  if (message.length > 1000) return jsonError('Message is too long.', 400);

  const { context, tripRequestId } = await buildTripContext({
    tripId: params.id,
    userId: user.id
  });

  if (!tripRequestId) return jsonError('Trip not found.', 404);

  const url = new URL(request.url);
  const wantsStream = url.searchParams.get('stream') === '1';
  const provider = resolveProvider();

  // History (last ~10 messages) for conversation memory.
  const history = (await tripRepository.getAgentMessages(tripRequestId))
    .slice(-10)
    .map<CoreMessage>((m) => ({
      role: m.role === 'USER' ? 'user' : 'assistant',
      content: m.content
    }));

  // No LLM configured → deterministic canned replies.
  if (provider === 'none') {
    const reply = ruleBasedReply(message, context);
    await persistChatExchange({ tripRequestId, userMessage: message, assistantMessage: reply });
    return jsonOk({ reply, provider: 'rule-based' });
  }

  // Stream mode.
  if (wantsStream) {
    try {
      const result = await streamTripChat({
        provider,
        history,
        context,
        userMessage: message,
        async onFinish({ text }) {
          await persistChatExchange({
            tripRequestId,
            userMessage: message,
            assistantMessage: text
          });
        }
      });

      // `toDataStreamResponse()` emits the SSE frames that `useChat`
      // on the client expects. Persistence happens in onFinish above.
      return result.toDataStreamResponse();
    } catch (err) {
      console.error('[chat] streaming failed:', err);
      const reply = ruleBasedReply(message, context);
      await persistChatExchange({ tripRequestId, userMessage: message, assistantMessage: reply });
      return jsonOk({ reply, provider: 'fallback', degraded: true });
    }
  }

  // Non-stream mode: buffer the stream to produce a single JSON reply.
  try {
    const result = await streamTripChat({
      provider,
      history,
      context,
      userMessage: message
    });
    const reply = await result.text;
    await persistChatExchange({ tripRequestId, userMessage: message, assistantMessage: reply });
    return jsonOk({
      reply,
      provider,
      guarded: isLikelyPromptInjection(message)
    });
  } catch (err) {
    console.error('[chat] LLM call failed:', err);
    const reply = ruleBasedReply(message, context);
    await persistChatExchange({ tripRequestId, userMessage: message, assistantMessage: reply });
    return jsonOk({ reply, provider: 'fallback', degraded: true });
  }
}
