import { jsonError, jsonOk, requireApiUser } from '@/server/http/route-helpers';
import { revokeShare } from '@/server/services/share.service';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; shareId: string } }
) {
  const user = await requireApiUser();
  try {
    await revokeShare({
      userId: user.id,
      tripId: params.id,
      shareId: params.shareId
    });
    return jsonOk({ revoked: true });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : 'Unable to revoke share link.',
      400
    );
  }
}
