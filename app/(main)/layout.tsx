import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { auth } from "@/lib/auth";
import { getMe } from "@/lib/me";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMe(session.user.id);
  return <AppShell initialMe={me}>{children}</AppShell>;
}
