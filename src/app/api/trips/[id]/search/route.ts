import { searchService } from '@/server/services/search.service';
import { jsonError, jsonOk, requireApiUser } from '@/server/http/route-helpers';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    const request = await searchService.runSearch(user.id, params.id);
    return jsonOk({ requestId: request?.id, packageCount: request?.packages.length ?? 0 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to run search.', 400);
  }
}
