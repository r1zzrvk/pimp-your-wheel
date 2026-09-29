import { errorResponse } from "@/lib/api-error";
import { getMe } from "@/lib/me";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return Response.json(await getMe(userId));
  } catch (error) {
    return errorResponse(error);
  }
}
