import { errorResponse } from "@/lib/api-error";
import { performSpin } from "@/lib/game";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return Response.json(await performSpin(userId));
  } catch (error) {
    return errorResponse(error);
  }
}
