import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

interface LoginFormProps {
  onSuccess?: () => void;
  showTitle?: boolean;
  defaultNextPath?: string | null;
}

export function LoginForm({ onSuccess, showTitle = true, defaultNextPath = null }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState<"google" | "kakao" | "email" | null>(null);

  // BFCache 복원(뒤로가기) 시 OAuth 로딩 상태 초기화
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setIsLoading(null);
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const setLoginModalOpen = useAuthStore((state) => state.setLoginModalOpen);

  const sanitizeNextPath = (value: string | null | undefined) => {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
      return null;
    }
    return value;
  };

  const resolveNextPath = () => {
    const requestedNext = sanitizeNextPath(searchParams.get("next"));
    if (requestedNext) {
      return requestedNext;
    }
    return sanitizeNextPath(defaultNextPath);
  };

  const resolveDestination = () => {
    const nextPath = resolveNextPath();
    if (nextPath === "/setup-profile") {
      return "/chat";
    }
    return nextPath ?? "/mypage";
  };

  const buildSetupProfilePath = () => {
    const nextPath = resolveDestination();
    return `/setup-profile?next=${encodeURIComponent(nextPath)}`;
  };

  const routeByProfile = async (showSuccessToast: boolean) => {
    const hasProfile = await refreshProfile();

    if (onSuccess) {
      onSuccess();
    }
    setLoginModalOpen(false);

    if (!hasProfile) {
      if (showSuccessToast) {
        toast.success("로그인되었습니다. 사주 정보 입력을 진행해주세요.");
      }
      navigate(buildSetupProfilePath(), { replace: true });
      return;
    }

    if (showSuccessToast) {
      toast.success("로그인되었습니다.");
    }
    navigate(resolveDestination(), { replace: true });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Supabase 환경 변수가 설정되지 않았습니다.");
      return;
    }

    setIsLoading("email");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          toast.error("이메일 인증이 완료되지 않았습니다. 메일함을 확인하여 인증을 완료해주세요.");
          navigate("/verify-email");
          return;
        }
        throw error;
      }
      await routeByProfile(true);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(null);
    }
  };

  const startOAuth = async (provider: "google" | "kakao") => {
    if (!isSupabaseConfigured) {
      toast.error("Supabase 환경 변수가 설정되지 않았습니다.");
      return;
    }

    setIsLoading(provider);
    trackEvent("auth_converted", { provider });

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(resolveDestination())}`,
      },
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {showTitle && (
        <header className="space-y-2">
          <h1 className="text-h2 text-foreground font-bold text-2xl">로그인</h1>
          <p className="text-sm text-muted-foreground">로그인하면 클라우드 저장, 기록 동기화, 알림 기능을 사용할 수 있습니다.</p>
        </header>
      )}

      <Card className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-3">
          <Button
            variant="outline"
            className="h-12 w-full border-none bg-[#24303F] text-white hover:bg-[#1D2733]"
            onClick={() => void startOAuth("google")}
            disabled={isLoading !== null}
          >
            {isLoading === "google" ? "Google 연결 중..." : "Google로 계속하기"}
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full border-none bg-[#FEE500] text-[#191919] hover:bg-[#F7DB00]"
            onClick={() => void startOAuth("kakao")}
            disabled={isLoading !== null}
          >
            {isLoading === "kakao" ? "Kakao 연결 중..." : "Kakao로 계속하기"}
          </Button>
        </div>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 font-medium text-muted-foreground">또는 이메일 로그인</span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="h-12 w-full" disabled={isLoading !== null}>
            {isLoading === "email" ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm">
          계정이 없으신가요?{" "}
          <Link 
            to="/signup" 
            className="text-primary font-medium hover:underline"
            onClick={() => setLoginModalOpen(false)}
          >
            회원가입
          </Link>
        </div>
        <p className="mt-4 text-center text-[12px] leading-5 text-muted-foreground">
          로그인 시 개인정보 처리방침과 이용약관에 동의한 것으로 간주됩니다.
        </p>
      </Card>
    </div>
  );
}
