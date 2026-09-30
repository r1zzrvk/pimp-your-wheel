import { meta } from "@/components/meta";
import { WheelScreen } from "@/components/wheel-screen";
import { auth } from "@/lib/auth";
import { claimLimitResetSession } from "@/lib/limit-reset";

export const metadata = meta({
  title: "Главная",
  description: "Крути рулетку и забирай монеты.",
});

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; session_id?: string }>;
}) {
  const { reset, session_id: sessionId } = await searchParams;
  const session = await auth();
  const granted =
    reset === "success" && sessionId && session?.user?.id
      ? (await claimLimitResetSession(session.user.id, sessionId)).spinsGranted
      : 0;

  return (
    <WheelScreen
      resetNotice={reset === "cancel" ? "cancel" : granted > 0 ? "success" : null}
    />
  );
}
