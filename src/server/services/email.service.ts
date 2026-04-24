import { EmailKind, EmailDeliveryStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { sendgridProvider } from '@/server/integrations/sendgrid-provider';
import type { NotificationPayload } from '@/types/travel';

type SendEmailInput = NotificationPayload & {
  kind: EmailKind;
  userId?: string;
  bookingId?: string;
  tripId?: string;
  shareId?: string;
};

export const emailService = {
  isConfigured() {
    return sendgridProvider.isConfigured();
  },

  async sendUserEmail(input: SendEmailInput) {
    const delivery = await prisma.emailDelivery.create({
      data: {
        userId: input.userId,
        bookingId: input.bookingId,
        tripId: input.tripId,
        shareId: input.shareId,
        kind: input.kind,
        provider: sendgridProvider.name,
        toEmail: input.toEmail,
        subject: input.subject,
        payload: {
          html: input.html,
          text: input.text,
          templateData: input.templateData,
          dynamicTemplateId: input.dynamicTemplateId
        }
      }
    });

    try {
      const result = await sendgridProvider.send(input);
      await prisma.emailDelivery.update({
        where: { id: delivery.id },
        data: {
          status: EmailDeliveryStatus.SENT,
          providerMessageId: result.providerMessageId,
          sentAt: new Date(),
          lastError: null
        }
      });
      return { ok: true, deliveryId: delivery.id, providerMessageId: result.providerMessageId };
    } catch (error) {
      await prisma.emailDelivery.update({
        where: { id: delivery.id },
        data: {
          status: EmailDeliveryStatus.FAILED,
          lastError: error instanceof Error ? error.message : 'Failed to send email.'
        }
      });
      throw error;
    }
  },

  async safeSendUserEmail(input: SendEmailInput) {
    try {
      return await this.sendUserEmail(input);
    } catch (error) {
      console.error('emailService.safeSendUserEmail failed', error);
      return { ok: false, error: error instanceof Error ? error.message : 'Failed to send email.' };
    }
  }
};
