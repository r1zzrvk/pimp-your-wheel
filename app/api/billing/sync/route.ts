import { errorResponse } from "@/lib/api-error";
import { syncBilling } from "@/lib/billing";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const userId = await requireUserId();
    if (!userId) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    return Response.json(await syncBilling(userId));
  } catch (error) {
    return errorResponse(error);
  }
}
