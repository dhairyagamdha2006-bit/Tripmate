import { destroyCurrentSession } from '@/lib/auth/session';
import { jsonOk } from '@/server/http/route-helpers';

export async function POST() {
  await destroyCurrentSession();
  return jsonOk({ success: true });
}
