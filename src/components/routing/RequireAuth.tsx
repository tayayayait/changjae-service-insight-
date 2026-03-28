import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

interface RequireAuthProps {
  children: ReactNode;
  requireProfile?: boolean;
  unauthenticatedMode?: "redirect" | "modal";
}

export function RequireAuth({
  children,
  requireProfile = false,
  unauthenticatedMode = "redirect",
}: RequireAuthProps) {
  const location = useLocation();
  const initialized = useAuthStore((state) => state.initialized);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const hasProfile = useAuthStore((state) => state.hasProfile);
  const setLoginModalOpen = useAuthStore((state) => state.setLoginModalOpen);
  const requestedPath = `${location.pathname}${location.search}`;
  const encodedNext = encodeURIComponent(requestedPath || "/chat");

  useEffect(() => {
    if (unauthenticatedMode !== "modal") {
      return;
    }
    if (!initialized || isLoading || user) {
      return;
    }
    setLoginModalOpen(true);
  }, [initialized, isLoading, setLoginModalOpen, unauthenticatedMode, user]);

  if (!initialized || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="auth-loading" />
      </div>
    );
  }

  if (!user) {
    if (unauthenticatedMode === "modal") {
      return <>{children}</>;
    }
    return <Navigate to={`/login?next=${encodedNext}`} replace />;
  }

  if (requireProfile && !hasProfile) {
    return <Navigate to={`/setup-profile?next=${encodedNext}`} replace />;
  }

  return <>{children}</>;
}
