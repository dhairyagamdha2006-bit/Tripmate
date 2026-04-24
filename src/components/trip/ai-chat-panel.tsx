"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/utils/date';

export function AIChatPanel({
  tripId,
  messages,
  enabled
}: {
  tripId: string;
  messages: Array<{ id: string; role: string; type: string; content: string; createdAt: string }>;
  enabled: boolean;
}) {
  const [prompt, setPrompt] = useState('What is the best balance between budget and comfort here?');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState(messages);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tripmate AI</CardTitle>
        <CardDescription>
          {enabled
            ? 'Ask for tradeoffs, savings ideas, neighborhood guidance, or itinerary reasoning. Conversation history is stored with this trip request.'
            : 'Configure AI_PROVIDER plus OPENAI_API_KEY or ANTHROPIC_API_KEY to unlock trip-specific conversation.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          {items.length ? (
            items.map((message) => (
              <div key={message.id} className={`rounded-2xl px-4 py-3 text-sm ${message.role === 'USER' ? 'ml-10 bg-sky-500/10 text-sky-100' : 'mr-10 bg-slate-900 text-slate-100'}`}>
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">{message.role}</div>
                <p className="whitespace-pre-wrap leading-7">{message.content}</p>
                <div className="mt-2 text-xs text-slate-500">{formatDateTime(message.createdAt)}</div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No AI conversation yet. Ask your first planning question.</p>
          )}
        </div>

        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!enabled || !prompt.trim()) return;
            setLoading(true);
            setError(null);

            const optimistic = {
              id: `optimistic-${Date.now()}`,
              role: 'USER',
              type: 'QUESTION',
              content: prompt,
              createdAt: new Date().toISOString()
            };
            setItems((current) => [...current, optimistic]);
            const currentPrompt = prompt;
            setPrompt('');

            const response = await fetch(`/api/trips/${tripId}/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: currentPrompt })
            });
            const data = (await response.json()) as { ok: boolean; error?: string; message?: any };
            setLoading(false);

            if (!response.ok || !data.ok || !data.message) {
              setError(data.error ?? 'AI chat failed.');
              setItems((current) => current.filter((message) => message.id !== optimistic.id));
              setPrompt(currentPrompt);
              return;
            }

            setItems((current) => [
              ...current.filter((message) => message.id !== optimistic.id),
              optimistic,
              {
                id: data.message.id,
                role: data.message.role,
                type: data.message.type,
                content: data.message.content,
                createdAt: data.message.createdAt
              }
            ]);
          }}
        >
          <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Explain why one itinerary is better, ask how to reduce cost, or compare neighborhoods." disabled={!enabled || loading} />
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <Button disabled={!enabled || loading} type="submit">
            {loading ? 'Thinking...' : 'Ask Tripmate AI'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
