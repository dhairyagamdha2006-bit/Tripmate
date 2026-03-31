import type { NotificationProvider } from '@/server/integrations/contracts';
import type { NotificationPayload } from '@/types/travel';

export class SendGridNotificationProvider implements NotificationProvider {
  name = 'sendgrid';

  async send(_input: NotificationPayload): Promise<void> {
    throw new Error('SendGrid integration is not implemented yet. Replace this placeholder when provider credentials are available.');
  }
}
