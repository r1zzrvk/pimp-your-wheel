import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export class RegisterError extends Error {}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerUser(emailInput: string, password: string, nameInput?: string) {
  const email = emailInput.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new RegisterError("Введите корректный email");
  }
  if (password.length < 8) {
    throw new RegisterError("Пароль должен быть не короче 8 символов");
  }
  const displayName =
    nameInput === undefined
      ? ""
      : nameInput.trim().replace(/\s+/g, " ");
  if (nameInput !== undefined && !displayName) {
    throw new RegisterError("Введите имя");
  }
  if (displayName.length > 24) {
    throw new RegisterError("Имя не длиннее 24 символов");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    return await prisma.user.create({
      data: { email, passwordHash, displayName },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new RegisterError("Такой email уже зарегистрирован");
    }
    throw error;
  }
}
