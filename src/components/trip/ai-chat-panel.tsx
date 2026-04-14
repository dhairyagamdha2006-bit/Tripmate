'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils/date';
import type { AgentMessageView } from '@/types/travel';

type Message = {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
};

export function AIChatPanel({
  messages: initialMessages,
  tripId
}: {
  messages: AgentMessageView[];
  tripId: string;
}) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map((m) => ({
      id: m.id,
      role: m.role as 'USER' | 'ASSISTANT',
      content: m.content,
      createdAt: m.createdAt
    }))
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/trips/${tripId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Assistant failed to respond.');

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'ASSISTANT',
        content: data.reply,
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-base">Tripmate assistant</CardTitle>
        <p className="text-sm text-slate-500">
          Ask anything about your trip — flights, hotels, itinerary ideas.
        </p>
      </CardHeader>

      {/* Message list */}
      <CardContent className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center text-slate-400">
              <span className="mb-2 text-3xl">✈️</span>
              <p className="text-sm">Ask me anything about your trip.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'USER'
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <p
                  className={`mt-1 text-[11px] ${
                    msg.role === 'USER' ? 'text-teal-200' : 'text-slate-400'
                  }`}
                >
                  {formatDateTime(msg.createdAt)}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                <span className="animate-pulse">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </CardContent>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your trip… (Enter to send)"
            rows={2}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50"
          />
          <Button
            onClick={send}
            disabled={loading || !input.trim()}
            size="sm"
            className="shrink-0 self-end"
          >
            {loading ? '…' : 'Send'}
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">Enter to send · Shift+Enter for new line</p>
      </div>
    </Card>
  );
}
