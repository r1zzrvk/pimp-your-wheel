"use client";

import { createContext, useContext } from "react";
import type { MeResponse } from "@/lib/types";

type MeContextValue = {
  me: MeResponse | null;
  refresh: () => Promise<void>;
  patch: (partial: Partial<MeResponse>) => void;
};

export const MeContext = createContext<MeContextValue | null>(null);

export function useMe() {
  const value = useContext(MeContext);
  if (!value) throw new Error("useMe должен быть внутри AppShell");
  return value;
}
