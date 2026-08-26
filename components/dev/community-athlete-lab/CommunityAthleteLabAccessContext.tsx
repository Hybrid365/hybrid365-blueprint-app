"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

const LabAccessQueryContext = createContext("");

export function CommunityAthleteLabAccessProvider({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  return <LabAccessQueryContext.Provider value={value}>{children}</LabAccessQueryContext.Provider>;
}

export function useLabAccessSearchParams(): URLSearchParams {
  const fromContext = useContext(LabAccessQueryContext);
  const fromRoute = useSearchParams();
  const merged = new URLSearchParams(fromRoute.toString());
  new URLSearchParams(fromContext).forEach((value, key) => {
    if (!merged.has(key)) merged.set(key, value);
  });
  return merged;
}
