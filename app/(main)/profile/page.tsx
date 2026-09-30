import { meta } from "@/components/meta";
import { ProfileScreen } from "@/components/profile-screen";

export const metadata = meta({
  title: "Профиль",
  description: "Настройки пользователя",
});

export default function ProfilePage() {
  return <ProfileScreen />;
}
