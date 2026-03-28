import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function VerifyEmailPage() {
  return (
    <AppLayout hideBottomNav={true}>
      <div className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-lg flex-col justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="cosmic-surface relative overflow-hidden rounded-[24px] border-none p-8 text-center shadow-lg md:p-10">
            {/* Background Decorative Element */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-secondary/5 blur-3xl" />

            <div className="relative space-y-8">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 transition-transform hover:scale-105 duration-300">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                  <MailCheck className="h-10 w-10 text-primary" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h1 className="text-h2 font-editorial text-3xl font-bold tracking-tight text-foreground">
                  이메일을 확인해주세요
                </h1>
                <p className="report-prose text-text-secondary">
                  가입하신 이메일 주소로 인증 링크를 보냈습니다.<br className="hidden sm:block" />
                  이메일의 링크를 클릭하여 인증을 완료해 주세요.
                </p>
              </div>

              <div className="analysis-card-highlight space-y-4 text-left">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                  <div className="h-1 w-4 bg-primary rounded-full" />
                  도움말
                </div>
                <ul className="space-y-3 text-[14px] leading-relaxed text-text-secondary">
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">•</span>
                    이메일이 오지 않았다면 스팸 메일함을 확인해 보세요.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">•</span>
                    입력하신 이메일 주소가 정확한지 확인해 보세요.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">•</span>
                    인증 메일은 발송 후 일정 시간이 지나면 만료될 수 있습니다.
                  </li>
                </ul>
              </div>

              <div className="grid gap-3 pt-6">
                <Button asChild className="h-14 w-full rounded-xl text-button shadow-md transition-all hover:shadow-lg active:scale-[0.98]">
                  <Link to="/login?next=%2Fchat">
                    로그인 화면으로 돌아가기
                  </Link>
                </Button>
                
              </div>
            </div>
          </Card>
          
          <p className="mt-8 text-center text-sm text-text-muted">
            인증을 완료하신 후에도 로그인이 안 된다면 <br />
            고객센터로 문의해 주시기 바랍니다.
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
}
