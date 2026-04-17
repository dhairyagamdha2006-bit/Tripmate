import { z } from 'zod';

import { jsonError, jsonOk, requireApiUser } from '@/server/http/route-helpers';
import { createShare, listSharesForTrip } from '@/server/services/share.service';
import { appUrl } from '@/lib/env';

const createShareSchema = z.object({
  expiresInDays: z.number().int().min(1).max(365).optional()
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireApiUser();
  const shares = await listSharesForTrip(user.id, params.id);
  return jsonOk({
    shares: shares.map((s) => ({
      id: s.id,
      token: s.token,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt?.toISOString() ?? null,
      viewCount: s.viewCount,
      url: `${appUrl()}/share/${s.token}`
    }))
  });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireApiUser();
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = createShareSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Validation failed.', 400);
  }

  try {
    const share = await createShare({
      userId: user.id,
      tripId: params.id,
      expiresInDays: parsed.data.expiresInDays
    });
    return jsonOk({
      id: share.id,
      token: share.token,
      url: `${appUrl()}/share/${share.token}`,
      expiresAt: share.expiresAt?.toISOString() ?? null
    });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : 'Unable to create share link.',
      400
    );
  }
}
