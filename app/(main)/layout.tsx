import { AppShell } from "@/components/app-shell";
import { auth } from "@/lib/auth";
import { getGuestMe } from "@/lib/guest";
import { getMe } from "@/lib/me";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const me = session?.user?.id ? await getMe(session.user.id) : await getGuestMe();
  return <AppShell initialMe={me}>{children}</AppShell>;
}
