import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { meta } from "@/components/meta";

export const metadata = meta({
  title: "Вход",
  description: "Войди и крути сегодняшние попытки.",
});
import { auth } from "@/lib/auth";
import { loginAction } from "./actions";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/");

  return (
    <AuthForm
      title="С возвращением"
      subtitle="Войди и крути сегодняшние попытки."
      submitLabel="Войти"
      alternateHref="/register"
      alternateLabel="Нет аккаунта? Зарегистрироваться"
      action={loginAction}
    />
  );
}
