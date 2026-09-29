import { ApiError, errorResponse } from "@/lib/api-error";
import { startCheckout } from "@/lib/billing";
import type { PaidPlanId } from "@/lib/economy";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

function appOrigin(request: Request) {
  return process.env.AUTH_URL ?? new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const body = (await request.json()) as { plan?: unknown };
    if (body.plan !== "BASIC" && body.plan !== "PRO") {
      throw new ApiError(400, "UNKNOWN_PLAN");
    }
    return Response.json(await startCheckout(userId, body.plan as PaidPlanId, appOrigin(request)));
  } catch (error) {
    return errorResponse(error);
  }
}
