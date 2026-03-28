import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Clock, HelpCircle, ShieldCheck, CreditCard, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HelpPage() {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-4xl space-y-10 px-6 py-12 md:py-16">
        
        {/* Header Section */}
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-black text-foreground md:text-5xl font-editorial tracking-tight">
            고객센터 및 도움말
          </h1>
          <p className="mx-auto max-w-xl text-[15px] font-medium leading-relaxed text-text-secondary">
            사주 인사이트를 이용하시면서 궁금한 점이 있으신가요?
            <br className="hidden md:block" />
            자주 묻는 질문을 확인하시거나 언제든 고객센터로 문의해주세요.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          
          {/* 1. Service Guide */}
          <Card className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
            <CardHeader className="bg-bg-subtle/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Sprout className="h-5 w-5" />
                </div>
                서비스 이용 안내
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 text-[14px] leading-relaxed text-foreground">
              <div>
                <strong className="block mb-1 text-slate-800">Q. 출생 시간을 모르면 분석이 불가능한가요?</strong>
                <p className="text-text-secondary">A. 분석이 가능합니다. 정보 입력 시 '모름'을 선택하셔도 생년월일을 바탕으로 핵심적인 운세 흐름과 기운을 충분히 분석해 드립니다.</p>
              </div>
              <div className="pt-2 border-t border-border border-dashed">
                <strong className="block mb-1 text-slate-800">Q. 여러 명의 궁합을 볼 수 있나요?</strong>
                <p className="text-text-secondary">A. 현재는 1:1 기반의 커플 궁합 리포트를 집중적으로 제공하고 있습니다. 새로운 분석 대상이 있다면 브라우저 상단 GNB의 '삭제' 버튼을 눌러 기존 기록을 초기화한 후 새롭게 진행하실 수 있습니다.</p>
              </div>
            </CardContent>
          </Card>

          {/* 2. Privacy */}
          <Card className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition-all hover:border-accent-lavender/40 hover:shadow-md">
            <CardHeader className="bg-bg-subtle/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <div className="rounded-full bg-accent-lavender/10 p-2 text-accent-lavender">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                개인정보 보호 정책
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 text-[14px] leading-relaxed text-foreground">
              <div>
                <strong className="block mb-1 text-slate-800">Q. 내 사주 정보는 안전하게 보관되나요?</strong>
                <p className="text-text-secondary">A. 네, 안심하셔도 좋습니다. 사주 인사이트는 개인의 민감한 생년월일 정보를 안전하게 암호화하여 처리하며, 분석 목적 외에는 절대 사용되거나 제3자에게 제공되지 않습니다.</p>
              </div>
              <div className="pt-2 border-t border-border border-dashed">
                <strong className="block mb-1 text-slate-800">Q. 데이터를 완전히 지우고 싶어요.</strong>
                <p className="text-text-secondary">A. 상단 메뉴의 <strong className="text-red-500">삭제</strong> 버튼을 누르시면, 현재 브라우저 기기에 임시 저장된 고객님의 접속 세션 및 조회 기록이 즉시 모두 초기화됩니다.</p>
              </div>
            </CardContent>
          </Card>

          {/* 3. Payment & Refund */}
          <Card className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition-all hover:border-amber-500/40 hover:shadow-md">
            <CardHeader className="bg-bg-subtle/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <div className="rounded-full bg-amber-100 p-2 text-amber-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                결제 및 리포트 열람 안내
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 text-[14px] leading-relaxed text-foreground">
              <div>
                <strong className="block mb-1 text-slate-800">Q. 이미 결제한 리포트를 다시 볼 수 있나요?</strong>
                <p className="text-text-secondary">A. 네, 상단 메뉴의 <strong>'최근 결과'</strong> 페이지에서 결제 당시 입력하셨던 정보(이름/연락처/이메일)를 입력하시면 언제든 다시 열람할 수 있습니다. 단, 보안을 위해 결제일로부터 <strong>30일 간만 보관</strong>됩니다.</p>
              </div>
              <div className="pt-2 border-t border-border border-dashed">
                <strong className="block mb-1 text-slate-800">Q. 환불 규정이 어떻게 되나요?</strong>
                <p className="text-text-secondary">A. 디지털 콘텐츠 특성상, 분석이 완료되어 리포트가 정상적으로 열람된 이후에는 원칙적으로 환불이 불가능합니다. 단, 시스템 오류로 인해 리포트가 정상 지급되지 않은 경우 고객센터로 즉시 문의해주시기 바랍니다.</p>
              </div>
            </CardContent>
          </Card>

          {/* 4. Customer Support Contact */}
          <Card className="overflow-hidden rounded-3xl border-2 border-primary/10 bg-gradient-to-br from-bg-subtle to-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                  <HelpCircle className="h-5 w-5" />
                </div>
                고객센터 안내
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 text-[14px] leading-relaxed text-foreground">
              <p className="mb-6 text-text-secondary">
                위 자주 묻는 질문에서 원하시는 답변을 찾지 못하셨다면,
                고객센터 이메일로 언제든 문의를 남겨주세요.
              </p>
              
              <div className="space-y-4 rounded-xl bg-white p-5 border border-border">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h4 className="font-bold text-slate-800">이메일 문의</h4>
                    <p className="text-text-secondary mt-1">support@sajuflow.com</p>
                    <p className="text-xs text-text-secondary mt-1">근무 시간 내 순차적으로 안내해드리고 있습니다.</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <h4 className="font-bold text-slate-800">운영 시간 (Operating Hours)</h4>
                      <p className="text-text-secondary mt-1">평일 (월~금) 10:00 - 18:00</p>
                      <p className="text-xs text-text-secondary mt-1">주말 및 공휴일은 휴무입니다.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  className="w-full h-12 rounded-xl text-base font-bold bg-primary hover:bg-primary-hover text-white shadow-sm"
                  onClick={() => window.location.href = "mailto:support@sajuflow.com"}
                >
                  <Mail className="mr-2 h-5 w-5" />
                  고객센터에 이메일 보내기
                </Button>
              </div>
            </CardContent>
          </Card>
          
        </div>
      </div>
    </AppLayout>
  );
}

