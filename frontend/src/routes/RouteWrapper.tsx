import { Suspense } from "react";
import type { ReactNode } from "react";
import { LoadingScreen } from "@/components/shared/LoadingScreen";

export function RouteWrapper({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>;
}
