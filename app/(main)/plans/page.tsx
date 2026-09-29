import { PlansScreen } from "@/components/plans-screen";
import { auth } from "@/lib/auth";
import { getBilling, syncBilling } from "@/lib/billing";
import { redirect } from "next/navigation";

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { checkout } = await searchParams;
  const billing =
    checkout === "success"
      ? await syncBilling(session.user.id)
      : await getBilling(session.user.id);

  return <PlansScreen initial={billing} checkout={checkout} />;
}
