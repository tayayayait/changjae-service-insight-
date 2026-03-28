import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { FortuneSubNav } from "@/components/fortune/FortuneSubNav";
import { FortuneSpecialGrid } from "@/components/fortune/FortuneSpecialGrid";
import { CategoryHero } from "@/components/fortune/CategoryHero";

export default function FortuneHubPage() {
  const heroConfig = {
    label: "2026 신년 운세 정밀 분석",
    title: "병오년의 기운을 담은\n당신의 1년 흐름",
    description: "사주 명리학의 깊이 있는 해석을 통해 2026년 당신에게 찾아올 결정적 변화와 기회의 시점을 미리 확인하세요."
  };

  return (
    <AppLayout showVideoBackground={true} hideFooter={true}>
      <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-8 md:py-12">
        <CategoryHero 
          bannerConfig={heroConfig}
          themeColor="accent-lavender"
        />

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
              최근에 확인한 내 역사는 <Link to="/mypage" className="font-bold text-indigo-600 underline">리포트 다시보기</Link>에서 확인할 수 있습니다.
            </p>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}
