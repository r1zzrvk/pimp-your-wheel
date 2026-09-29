import { ApiError, errorResponse } from "@/lib/api-error";
import { performPurchase } from "@/lib/game";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const body = (await request.json()) as { cosmeticId?: unknown };
    if (typeof body.cosmeticId !== "string" || body.cosmeticId.length === 0) {
      throw new ApiError(400, "NOT_FOUND");
    }
    await performPurchase(userId, body.cosmeticId);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
