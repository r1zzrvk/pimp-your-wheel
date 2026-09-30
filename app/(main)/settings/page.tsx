import { meta } from "@/components/meta";
import { redirect } from "next/navigation";

export const metadata = meta({ title: "Профиль" });

export default function SettingsPage() {
  redirect("/profile");
}
