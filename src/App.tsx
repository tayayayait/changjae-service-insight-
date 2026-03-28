import { Suspense, lazy, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { LazyLoadErrorBoundary } from "@/components/common/LazyLoadErrorBoundary";
import { warmCoreRoutes } from "@/lib/routePrefetch";
import { RequireAuth } from "@/components/routing/RequireAuth";
import { LegacyRedirect } from "./components/routing/LegacyRedirect";
import { SidebarLayout } from "./components/layout/SidebarLayout";
import CategoryPage from "./pages/CategoryPage";
import { useAuthStore } from "./store/useAuthStore";

const DeferredToaster = lazy(() =>
  import("./components/ui/toaster").then((module) => ({
    default: module.Toaster,
  })),
);
const DeferredLoginModal = lazy(() =>
  import("./components/auth/LoginModal").then((module) => ({
    default: module.LoginModal,
  })),
);
const FunnelLayout = lazy(() =>
  import("./components/layout/FunnelLayout").then((module) => ({
    default: module.FunnelLayout,
  })),
);
const SajuInput = lazy(() => import("./pages/SajuInput"));
const ServiceLandingPage = lazy(() => import("./pages/ServiceLandingPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResultPage = lazy(() => import("./pages/ResultPage"));
const MyPage = lazy(() => import("./pages/MyPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const AstrologyPage = lazy(() => import("./pages/AstrologyPage"));
const DailyAstrologyPage = lazy(() => import("./pages/DailyAstrologyPage"));
const CosmicCalendarPage = lazy(() => import("./pages/CosmicCalendarPage"));
const FuturePartnerPage = lazy(() => import("./pages/love/FuturePartnerPage"));
const CoupleReportPage = lazy(() => import("./pages/love/CoupleReportPage"));
const CrushReunionPage = lazy(() => import("./pages/love/CrushReunionPage"));
const LoveReportDetailPage = lazy(() => import("./pages/love/LoveReportDetailPage"));
const AstrologyResultPage = lazy(() => import("./pages/astrology/AstrologyResultPage"));
const AstrologyPurchasedReportPage = lazy(
  () => import("./pages/astrology/AstrologyPurchasedReportPage"),
);
const SajuPurchasedReportPage = lazy(
  () => import("./pages/saju/SajuPurchasedReportPage"),
);
const ReportLookupPage = lazy(() => import("./pages/ReportLookupPage"));
const FortuneHubPage = lazy(() => import("./pages/fortune/FortuneHubPage"));
const FortunePersonalPage = lazy(() => import("./pages/fortune/FortunePersonalPage"));
const YearlyFortunePage = lazy(() => import("./pages/fortune/YearlyFortunePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ProfileSetupPage = lazy(() => import("./pages/ProfileSetup"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const SuggestionPage = lazy(() => import("./pages/SuggestionPage"));
const AdminSuggestionsPage = lazy(() => import("./pages/AdminSuggestionsPage"));
const AdminPaymentsPage = lazy(() => import("./pages/AdminPaymentsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="flex h-[80vh] w-full items-center justify-center bg-transparent">
    <div className="cosmic-surface flex flex-col items-center gap-6 rounded-2xl p-8 text-center">
      <div className="relative">
        <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-accent-lavender/20 border-t-accent-lavender" />
        <div className="absolute inset-0 h-14 w-14 animate-pulse rounded-full border border-primary/30" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-black uppercase tracking-tight text-primary/90">코스모스 동기화 중</p>
        <p className="text-xs font-bold text-text-secondary">페이지 데이터를 불러오는 중...</p>
      </div>
    </div>
  </div>
);

const RouteOverlays = ({ isToasterEnabled }: { isToasterEnabled: boolean }) => {
  const pathname = useLocation().pathname;
  const initialized = useAuthStore((state) => state.initialized);
  const user = useAuthStore((state) => state.user);
  const shouldLoadLoginModal = pathname === "/chat" && initialized && !user;

  return (
    <>
      {isToasterEnabled ? (
        <Suspense fallback={null}>
          <DeferredToaster />
        </Suspense>
      ) : null}
      {shouldLoadLoginModal ? (
        <Suspense fallback={null}>
          <DeferredLoginModal />
        </Suspense>
      ) : null}
    </>
  );
};

const App = () => {
  const initialize = useAuthStore((state) => state.initialize);
  const [isToasterEnabled, setIsToasterEnabled] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const networkInfo = navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        effectiveType?: string;
      };
    };
    const effectiveType = networkInfo.connection?.effectiveType;
    const shouldWarmup =
      !networkInfo.connection?.saveData &&
      effectiveType !== "slow-2g" &&
      effectiveType !== "2g";

    const toasterTimer = window.setTimeout(
      () => setIsToasterEnabled(true),
      shouldWarmup ? 600 : 1000,
    );

    let fallbackTimer: number | null = null;
    let idleCallbackId: number | null = null;
    const idleHost = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (shouldWarmup) {
      if (typeof idleHost.requestIdleCallback === "function") {
        idleCallbackId = idleHost.requestIdleCallback(() => {
          warmCoreRoutes();
        }, { timeout: 2_000 });
      } else {
        fallbackTimer = window.setTimeout(() => {
          warmCoreRoutes();
        }, 1_200);
      }
    }

    return () => {
      window.clearTimeout(toasterTimer);
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer);
      }
      if (idleCallbackId !== null && typeof idleHost.cancelIdleCallback === "function") {
        idleHost.cancelIdleCallback(idleCallbackId);
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RouteOverlays isToasterEnabled={isToasterEnabled} />
        <LazyLoadErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route element={<SidebarLayout />}>
                <Route path="/" element={<Navigate to="/category/saju" replace />} />
                <Route path="/category/:categoryId" element={<CategoryPage />} />
                <Route path="/fortune" element={<FortuneHubPage />} />
                <Route
                  path="/chat"
                  element={
                    <RequireAuth requireProfile unauthenticatedMode="modal">
                      <ChatPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/compatibility"
                  element={
                    <LegacyRedirect
                      to="/love/couple-report"
                      message="기존 궁합 경로는 커플 궁합 리포트로 통합되었습니다."
                    />
                  }
                />
                <Route path="/mypage" element={<MyPage />} />
                <Route path="/my-reports" element={<LegacyRedirect to="/mypage" message="리포트 다시보기 페이지로 이동합니다." />} />
                <Route path="/suggestions" element={<SuggestionPage />} />
                <Route path="/result" element={<ResultPage />} />
                <Route path="/result/:resultId" element={<ResultPage />} />
                <Route path="/astrology" element={<AstrologyPage />} />
                <Route
                  path="/astrology/synastry"
                  element={
                    <LegacyRedirect
                      to="/love/couple-report"
                      message="기존 합궁 경로는 커플 궁합 리포트로 통합되었습니다."
                    />
                  }
                />
                <Route path="/astrology/daily" element={<DailyAstrologyPage />} />
                <Route path="/astrology/calendar" element={<CosmicCalendarPage />} />
                <Route path="/love/future-partner" element={<FuturePartnerPage />} />
                <Route path="/love/couple-report" element={<CoupleReportPage />} />
                <Route path="/love/crush-reunion" element={<CrushReunionPage />} />
                <Route path="/love/report/:reportId" element={<LoveReportDetailPage />} />
                <Route path="/astrology/result/:resultId" element={<AstrologyResultPage />} />
                <Route
                  path="/astrology/purchased/:reportId"
                  element={<AstrologyPurchasedReportPage />}
                />
                <Route
                  path="/saju/purchased/:reportId"
                  element={<SajuPurchasedReportPage />}
                />
              </Route>

              <Route element={<FunnelLayout />}>
                <Route path="/service/:serviceId" element={<ServiceLandingPage />} />
                <Route path="/saju" element={<SajuInput />} />
                <Route path="/fortune/personal" element={<FortunePersonalPage />} />
                <Route
                  path="/fortune/quick"
                  element={
                    <LegacyRedirect
                      to="/category/saju?tab=today"
                      message="간편 운세 메뉴는 오늘의 운세 탭으로 통합되었습니다."
                    />
                  }
                />
                <Route path="/fortune/yearly" element={<YearlyFortunePage />} />
                <Route
                  path="/fortune/good-days"
                  element={
                    <LegacyRedirect
                      to="/astrology/calendar"
                      message="좋은 날 캘린더는 코스믹 캘린더로 통합되었습니다."
                    />
                  }
                />
                <Route
                  path="/fortune/dream"
                  element={
                    <LegacyRedirect
                      to="/category/saju?tab=today"
                      message="꿈해몽 서비스는 준비 중입니다. 다른 메뉴를 이용해주세요."
                    />
                  }
                />
              </Route>

              <Route path="/admin/suggestions" element={<AdminSuggestionsPage />} />
              <Route path="/admin/payments" element={<AdminPaymentsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/setup-profile" element={<ProfileSetupPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </LazyLoadErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
