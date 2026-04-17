import type { NotificationProvider } from '@/server/integrations/contracts';
import type { NotificationPayload } from '@/types/travel';

export class MockNotificationProvider implements NotificationProvider {
  name = 'mock-notifications';

  async send(input: NotificationPayload): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      '[Tripmate notification]',
      JSON.stringify({
        to: input.toEmail,
        name: input.toName,
        subject: input.subject,
        templateData: input.templateData ?? {}
      })
    );
  }
}
