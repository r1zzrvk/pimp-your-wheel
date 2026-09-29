import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { auth } from "@/lib/auth";
import { registerAction } from "../login/actions";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/");

  return (
    <AuthForm
      title="Создать аккаунт"
      subtitle="100 бесплатных круток в сутки. Скины покупаются за монеты с колеса."
      submitLabel="Создать аккаунт"
      alternateHref="/login"
      alternateLabel="Уже есть аккаунт? Войти"
      action={registerAction}
    />
  );
}
