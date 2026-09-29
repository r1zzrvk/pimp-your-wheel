import { errorResponse } from "@/lib/api-error";
import { performSetShine } from "@/lib/game";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const body = (await request.json()) as { enabled?: unknown };
    await performSetShine(userId, body.enabled === true);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
