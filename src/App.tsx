import { Suspense, lazy, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { SidebarLayout } from "./components/layout/SidebarLayout";
import { FunnelLayout } from "./components/layout/FunnelLayout";
import { LegacyRedirect } from "./components/routing/LegacyRedirect";
import CategoryPage from "./pages/CategoryPage";
import SajuInput from "./pages/SajuInput";
import ServiceLandingPage from "./pages/ServiceLandingPage";
import { useAuthStore } from "./store/useAuthStore";

const NotFound = lazy(() => import("./pages/NotFound"));
const ResultPage = lazy(() => import("./pages/ResultPage"));
const MyPage = lazy(() => import("./pages/MyPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const AstrologyPage = lazy(() => import("./pages/AstrologyPage"));
const DailyAstrologyPage = lazy(() => import("./pages/DailyAstrologyPage"));
const CosmicCalendarPage = lazy(() => import("./pages/CosmicCalendarPage"));
const PalmistryPage = lazy(() => import("./pages/PalmistryPage"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const FuturePartnerPage = lazy(() => import("./pages/love/FuturePartnerPage"));
const CoupleReportPage = lazy(() => import("./pages/love/CoupleReportPage"));
const CrushReunionPage = lazy(() => import("./pages/love/CrushReunionPage"));
const LoveReportDetailPage = lazy(() => import("./pages/love/LoveReportDetailPage"));

const FortuneHubPage = lazy(() => import("./pages/fortune/FortuneHubPage"));
const FortunePersonalPage = lazy(() => import("./pages/fortune/FortunePersonalPage"));
const YearlyFortunePage = lazy(() => import("./pages/fortune/YearlyFortunePage"));

const queryClient = new QueryClient();

function RouteFallback() {
  const [isDelayed, setIsDelayed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsDelayed(true), 3500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">Loading page...</p>
        {isDelayed ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-gray-50"
          >
            로딩 지연 시 새로고침
          </button>
        ) : null}
      </div>
    </div>
  );
}
const App = () => {
  const { initialize, user, hasProfile, initialized } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route element={<SidebarLayout />}>
                <Route
                  path="/"
                  element={
                    initialized && user && !hasProfile ? (
                      <Navigate to="/setup-profile" replace />
                    ) : (
                      <Navigate to="/category/saju" replace />
                    )
                  }
                />
                <Route path="/category/:categoryId" element={<CategoryPage />} />
                <Route path="/fortune" element={<FortuneHubPage />} />
                <Route
                  path="/compatibility"
                  element={<LegacyRedirect to="/love/couple-report" message="기존 궁합 경로는 커플 궁합 리포트로 통합되었습니다." />}
                />
                <Route path="/mypage" element={<MyPage />} />
                <Route path="/result" element={<ResultPage />} />
                <Route path="/result/:resultId" element={<ResultPage />} />
                <Route path="/astrology" element={<AstrologyPage />} />
                <Route
                  path="/astrology/synastry"
                  element={<LegacyRedirect to="/love/couple-report" message="별자리 궁합은 커플 궁합 리포트로 통합되었습니다." />}
                />
                <Route path="/astrology/daily" element={<DailyAstrologyPage />} />
                <Route path="/astrology/calendar" element={<CosmicCalendarPage />} />
                <Route path="/palmistry" element={<PalmistryPage />} />
                <Route path="/love/future-partner" element={<FuturePartnerPage />} />
                <Route path="/love/couple-report" element={<CoupleReportPage />} />
                <Route path="/love/crush-reunion" element={<CrushReunionPage />} />
                <Route path="/love/report/:reportId" element={<LoveReportDetailPage />} />
              </Route>

              <Route element={<FunnelLayout />}>
                <Route path="/service/:serviceId" element={<ServiceLandingPage />} />
                <Route path="/saju" element={<SajuInput />} />
                <Route path="/fortune/personal" element={<FortunePersonalPage />} />
                <Route
                  path="/fortune/quick"
                  element={<LegacyRedirect to="/category/saju?tab=today" message="간편 운세는 오늘의 운세 메뉴로 통합되었습니다." />}
                />
                <Route path="/fortune/yearly" element={<YearlyFortunePage />} />
                <Route
                  path="/fortune/good-days"
                  element={<LegacyRedirect to="/astrology/calendar" message="길일 기능은 코스믹 이벤트로 통합되었습니다." />}
                />
                <Route
                  path="/fortune/dream"
                  element={<LegacyRedirect to="/category/saju?tab=today" message="꿈해몽 메뉴는 현재 통합 정리 중입니다." />}
                />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/setup-profile" element={<ProfileSetup />} />
              </Route>

              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

