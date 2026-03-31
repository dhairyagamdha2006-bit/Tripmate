import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils/date';
import type { AgentMessageView } from '@/types/travel';

export function AIChatPanel({ messages }: { messages: AgentMessageView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Tripmate assistant</CardTitle>
        <p className="text-sm text-slate-500">Planning updates and recommendation notes.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm ${message.role === 'USER' ? 'ml-auto bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'}`}>
            <p>{message.content}</p>
            <p className={`mt-1 text-[11px] ${message.role === 'USER' ? 'text-blue-100' : 'text-slate-400'}`}>{formatDateTime(message.createdAt)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
