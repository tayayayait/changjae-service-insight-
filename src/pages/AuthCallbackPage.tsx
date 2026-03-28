import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuthStore } from "@/store/useAuthStore";

const resolveSafeNextPath = (value: string | null) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  return value;
};

const normalizePostSetupNextPath = (nextPath: string | null) =>
  nextPath === "/setup-profile" ? "/chat" : nextPath;

const buildSetupProfilePath = (nextPath: string | null) => {
  if (!nextPath) {
    return "/setup-profile";
  }
  return `/setup-profile?next=${encodeURIComponent(nextPath)}`;
};

const buildLoginPath = (nextPath: string | null) => {
  if (!nextPath) {
    return "/login";
  }
  return `/login?next=${encodeURIComponent(nextPath)}`;
};

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routedRef = useRef(false);
  const initialized = useAuthStore((state) => state.initialized);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);

  const nextPath = useMemo(() => {
    const safePath = resolveSafeNextPath(searchParams.get("next"));
    return normalizePostSetupNextPath(safePath);
  }, [searchParams]);

  useEffect(() => {
    if (!initialized || isLoading || routedRef.current) {
      return;
    }

    routedRef.current = true;

    if (!user) {
      navigate(buildLoginPath(nextPath), { replace: true });
      return;
    }

    void (async () => {
      try {
        const hasProfile = await refreshProfile();
        if (hasProfile) {
          navigate(nextPath ?? "/chat", { replace: true });
          return;
        }
        navigate(buildSetupProfilePath(nextPath), { replace: true });
      } catch (error) {
        console.error("Auth callback routing failed:", error);
        navigate(buildLoginPath(nextPath), { replace: true });
      }
    })();
  }, [initialized, isLoading, navigate, nextPath, refreshProfile, user]);

  return (
    <AppLayout>
      <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="auth-callback-loading" />
        <p className="text-sm text-muted-foreground">Checking your login status...</p>
      </div>
    </AppLayout>
  );
}
