import { ApiError, errorResponse } from "@/lib/api-error";
import { performEquip } from "@/lib/game";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const body = (await request.json()) as { cosmeticId?: unknown; kind?: unknown };
    const slug = body.cosmeticId;
    if (slug !== null && typeof slug !== "string") {
      throw new ApiError(400, "NOT_FOUND");
    }
    const kind =
      body.kind === "pointer"
        ? "pointer"
        : body.kind === "background"
          ? "background"
          : body.kind === "animation"
            ? "animation"
            : "wheel";
    await performEquip(userId, slug, kind);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
