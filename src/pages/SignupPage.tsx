import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Supabase 환경 변수가 설정되지 않았습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) throw error;

      toast.success("회원가입이 완료되었습니다! 이메일 인증을 확인해주세요.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-lg space-y-6 px-6 py-8">
        <header className="space-y-2">
          <h1 className="text-h2 text-foreground text-2xl font-bold">회원가입</h1>
          <p className="text-sm text-muted-foreground">새로운 계정을 만들고 시작하세요.</p>
        </header>

        <Card className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSignup} className="space-y-4">
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
            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? "가입 중..." : "회원가입 시작하기"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            이미 계정이 있으신가요?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              로그인
            </Link>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
