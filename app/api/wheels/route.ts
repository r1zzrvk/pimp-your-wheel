import { ApiError, errorResponse } from "@/lib/api-error";
import { performSelectWheel } from "@/lib/game";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const body = (await request.json()) as { wheelId?: unknown };
    if (typeof body.wheelId !== "string") throw new ApiError(404, "UNKNOWN_WHEEL");
    await performSelectWheel(userId, body.wheelId);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
