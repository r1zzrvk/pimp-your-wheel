import { redirect } from "next/navigation";
import { meta } from "@/components/meta";
import { ProfileScreen } from "@/components/profile-screen";
import { auth } from "@/lib/auth";

export const metadata = meta({
  title: "Профиль",
  description: "Настройки пользователя",
});

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/register");
  return <ProfileScreen />;
}
