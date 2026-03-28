import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, MoonStar, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { useConsultStore } from "@/store/useConsultStore";

const UnicornVisual = React.lazy(() =>
  import("@/components/common/UnicornVisual").then((module) => ({
    default: module.UnicornVisual,
  })),
);

export const SidebarLayout = () => {
  const unicornProjectId = useConsultStore((state) => state.unicornProjectId);
  const setUnicornProjectId = useConsultStore((state) => state.setUnicornProjectId);
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (unicornProjectId && !location.pathname.includes("/astrology")) {
      setUnicornProjectId(null);
    }
  }, [location.pathname, setUnicornProjectId, unicornProjectId]);

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      {unicornProjectId ? (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-20">
          <React.Suspense fallback={<div className="h-full w-full" />}>
            <UnicornVisual projectId={unicornProjectId} height="100vh" showOverlay blurAmount="1.5px" />
          </React.Suspense>
        </div>
      ) : null}

      <div className="relative z-[60] hidden h-full w-[320px] flex-shrink-0 md:block">
        <Sidebar />
      </div>

      <div className="fixed left-0 right-0 top-0 z-[60] flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white"
          aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#24303F] text-[#C9A86A]">
            <MoonStar className="h-4 w-4" />
          </div>
          <div className="font-editorial text-lg font-semibold text-foreground">사주 인사이트</div>
        </div>
        <div className="w-10" />
      </div>

      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${
          isMobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden={!isMobileMenuOpen}
      />
      <aside
        className={`fixed left-0 top-0 z-[60] h-full w-[320px] border-r border-border bg-background transition-transform md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </aside>

      <main className="relative z-10 flex h-full flex-1 flex-col overflow-y-auto pt-16 md:pt-0">
        <div className="flex-1 w-full">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  );
};
