import { auth } from "@/lib/auth";

export async function requireUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}
