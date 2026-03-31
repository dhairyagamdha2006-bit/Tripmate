import type { NotificationProvider } from '@/server/integrations/contracts';
import type { NotificationPayload } from '@/types/travel';

export class MockNotificationProvider implements NotificationProvider {
  name = 'mock-sendgrid';

  async send(input: NotificationPayload): Promise<void> {
    console.log('[Tripmate notification]', input.to, input.subject);
  }
}
