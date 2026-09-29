import { errorResponse } from "@/lib/api-error";
import { startLimitReset } from "@/lib/limit-reset";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

function appOrigin(request: Request) {
  return process.env.AUTH_URL ?? new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    return Response.json(await startLimitReset(userId, appOrigin(request)));
  } catch (error) {
    return errorResponse(error);
  }
}
