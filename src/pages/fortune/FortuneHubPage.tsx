import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { FortuneSubNav } from "@/components/fortune/FortuneSubNav";
import { FortuneSpecialGrid } from "@/components/fortune/FortuneSpecialGrid";

export default function FortuneHubPage() {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-12 md:py-16">
        <header className="space-y-3 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-lavender/30 bg-accent-lavender/10 px-4 py-1.5 text-[13px] font-bold text-indigo-600 shadow-sm">
            <Sparkles className="h-4 w-4" />
            2026 병오년 신년운세
          </div>
          <h1 className="text-[32px] md:text-[42px] font-black leading-tight tracking-tight text-foreground">
            당신을 위한 2026년 운세 허브
          </h1>
          <p className="max-w-2xl text-[16px] leading-relaxed text-text-secondary">
            사주 명리학과 인연법을 기반으로 구성된 8가지 핵심 분석 항목을 통해 
            2026년 병오년의 흐름을 미리 확인하고 대비하세요.
          </p>
        </header>

        <FortuneSubNav />

        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900">핵심 분석 서비스</h2>
            <span className="text-[13px] font-medium text-text-muted">전체 8개 항목</span>
          </div>
          
          <FortuneSpecialGrid />
        </section>

        <Card className="relative overflow-hidden rounded-[32px] border-none bg-[#24303F] p-8 text-white shadow-xl md:p-12">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-xl space-y-4">
              <p className="text-[14px] font-bold uppercase tracking-widest text-indigo-300">New Feature</p>
              <h2 className="text-[28px] font-black leading-snug">
                내 사주 기반 맞춤형 리포트<br />
                더 정밀한 결과를 원하시나요?
              </h2>
              <p className="text-[16px] leading-relaxed text-gray-300">
                기본 운세 외에도 당신의 사주 원국을 깊게 분석한 '상세 리포트'를 3분 만에 받아보실 수 있습니다.
              </p>
            </div>
            <div className="shrink-0">
              <Link 
                to="/saju" 
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-white px-8 text-[16px] font-black text-[#24303F] shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                지금 무료 사주 분석하기
              </Link>
            </div>
          </div>
          
          {/* Decorative background elements */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        </Card>

        <footer className="pt-8 text-center sm:text-left">
          <div className="rounded-[24px] border border-gray-100 bg-gray-50/50 p-6">
            <p className="text-[13px] leading-6 text-text-secondary">
              <strong className="text-gray-900">안내:</strong> `/fortune`는 기능 탐색 및 연결을 담당하는 허브 페이지입니다. 
              실제 분석 결과는 각 항목을 통해 진입한 상세 분석 페이지에서 Gemini 2.0 AI의 실시간 연산을 통해 생성됩니다.
              최근에 확인한 내 역사는 <Link to="/my" className="font-bold text-indigo-600 underline">마이페이지</Link>에서 확인할 수 있습니다.
            </p>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}
