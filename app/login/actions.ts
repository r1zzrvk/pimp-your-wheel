"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { RegisterError, registerUser } from "@/lib/register-user";

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Неверный email или пароль" };
    }
    throw error;
  }
}

export async function registerAction(formData: FormData) {
  try {
    await registerUser(
      String(formData.get("email") ?? ""),
      String(formData.get("password") ?? ""),
      String(formData.get("displayName") ?? ""),
    );
  } catch (error) {
    if (error instanceof RegisterError) {
      return { error: error.message };
    }
    throw error;
  }

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Аккаунт создан, но войти не удалось" };
    }
    throw error;
  }
}
