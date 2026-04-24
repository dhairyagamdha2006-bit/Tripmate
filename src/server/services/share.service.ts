import { ShareLinkStatus } from '@prisma/client';
import { createPublicToken } from '@/lib/utils/tokens';
import { getBaseUrl } from '@/lib/utils/env';
import { shareTripSchema, sendShareEmailSchema } from '@/lib/validations/trip';
import { shareRepository } from '@/server/repositories/share.repository';
import { tripRepository } from '@/server/repositories/trip.repository';
import { emailService } from '@/server/services/email.service';
import { renderShareEmail } from '@/server/services/email-templates';

export const shareService = {
  async createShare(userId: string, tripId: string, payload: unknown) {
    const parsed = shareTripSchema.parse(payload);
    const trip = await tripRepository.getTripForUser(tripId, userId);
    if (!trip) {
      throw new Error('TRIP_NOT_FOUND');
    }

    const share = await shareRepository.create({
      tripId,
      createdById: userId,
      token: createPublicToken(18),
      note: parsed.note,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null
    });

    return {
      ...share,
      url: `${getBaseUrl()}/share/${share.token}`
    };
  },

  async revokeShare(userId: string, shareId: string) {
    const share = await shareRepository.findById(shareId);
    if (!share || share.createdById !== userId) {
      throw new Error('SHARE_NOT_FOUND');
    }
    return shareRepository.revoke(shareId);
  },

  async sendShareEmail(userId: string, tripId: string, payload: unknown) {
    const parsed = sendShareEmailSchema.parse(payload);
    const trip = await tripRepository.getTripForUser(tripId, userId);
    if (!trip) {
      throw new Error('TRIP_NOT_FOUND');
    }

    const share = trip.shares.find((item) => item.id === parsed.shareId && item.status === ShareLinkStatus.ACTIVE);
    if (!share) {
      throw new Error('SHARE_NOT_FOUND');
    }

    const senderName = trip.user.firstName ?? trip.user.name ?? 'A Tripmate traveler';
    const template = renderShareEmail({
      senderName,
      tripTitle: trip.title,
      shareUrl: `${getBaseUrl()}/share/${share.token}`,
      note: share.note ?? undefined
    });

    await emailService.sendUserEmail({
      userId,
      tripId,
      shareId: share.id,
      kind: 'ITINERARY_SHARE',
      toEmail: parsed.email,
      toName: parsed.recipientName,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    return { ok: true };
  },

  async getPublicShare(token: string) {
    const share = await shareRepository.findPublicByToken(token);
    if (!share || share.status !== ShareLinkStatus.ACTIVE) {
      return null;
    }

    if (share.expiresAt && share.expiresAt.getTime() < Date.now()) {
      return null;
    }

    await shareRepository.touchViewed(share.id);
    return share;
  }
};
