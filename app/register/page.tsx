import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { meta } from "@/components/meta";

export const metadata = meta({
  title: "Регистрация",
  description: "Создай аккаунт и получи 100 бесплатных круток в сутки.",
});
import { auth } from "@/lib/auth";
import { registerAction } from "../login/actions";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/");

  return (
    <AuthForm
      title="Готов начать?"
      subtitle="Создай аккаунт и начинай крутить."
      submitLabel="Создать аккаунт"
      alternateHref="/login"
      alternateLabel="Уже есть аккаунт? Войти"
      nameField
      action={registerAction}
    />
  );
}
