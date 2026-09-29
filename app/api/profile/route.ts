import { errorResponse } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { cleanAvatar, cleanDisplayName } from "@/lib/profile";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const body = (await request.json()) as { displayName?: unknown; avatar?: unknown };
    const displayName = cleanDisplayName(body.displayName);
    const avatar = cleanAvatar(body.avatar);
    await prisma.user.update({
      where: { id: userId },
      data: { displayName, avatar },
    });
    return Response.json({ displayName, avatar });
  } catch (error) {
    return errorResponse(error);
  }
}
