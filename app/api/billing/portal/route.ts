import { errorResponse } from "@/lib/api-error";
import { startPortal } from "@/lib/billing";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const origin = process.env.AUTH_URL ?? new URL(request.url).origin;
    return Response.json(await startPortal(userId, origin));
  } catch (error) {
    return errorResponse(error);
  }
}
