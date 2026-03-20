import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const HOME_PATH = "/category/saju";

const navItems = [
  { label: "홈", path: HOME_PATH },
  { label: "내 사주", path: "/saju" },
  { label: "운세", path: "/fortune" },
  { label: "궁합", path: "/love/couple-report" },
  { label: "보관함", path: "/mypage" },
];

const isRouteActive = (currentPath: string, targetPath: string) => {
  if (targetPath === "/") {
    return currentPath === "/";
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
};

const homeFocusLinks = [
  { label: "연애", path: "/?focus=love" },
  { label: "재물", path: "/?focus=wealth" },
  { label: "직장", path: "/?focus=career" },
  { label: "학업", path: "/?focus=study" },
  { label: "관계", path: "/?focus=relationship" },
  { label: "건강", path: "/?focus=health" },
  { label: "이사", path: "/?focus=move" },
  { label: "사업", path: "/?focus=business" },
];

export function GNB() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = location.pathname === "/";
  const currentSearch = `${location.pathname}${location.search}`;

  return (
    <header className="sticky top-0 z-gnb border-b border-border bg-bg-elevated/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-sp-4">
        <Link to={HOME_PATH} className="flex items-center gap-sp-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#24303F] text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-title text-foreground">사주운세</span>
            <span className="block text-[11px] font-semibold text-text-muted">쉬운 해석과 감성형 리포트</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-sp-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "text-button transition-fast hover:text-foreground",
                isRouteActive(location.pathname, item.path) ? "text-foreground" : "text-text-secondary",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            to="/help"
            className="inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-[13px] font-semibold text-text-secondary transition-fast hover:bg-bg-subtle hover:text-foreground"
          >
            도움말
          </Link>
          <Link
            to="/result"
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#24303F] px-4 text-[13px] font-semibold text-white transition-fast hover:bg-[#1D2733]"
          >
            최근 결과
          </Link>
        </div>

        <button
          className="flex h-11 w-11 items-center justify-center rounded-md md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen ? (
        <nav className="border-t border-border bg-bg-elevated px-sp-4 py-sp-4 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "block rounded-md px-sp-4 py-sp-3 text-button transition-fast",
                isRouteActive(location.pathname, item.path) ? "bg-accent text-foreground" : "text-text-secondary hover:bg-accent",
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-4 flex gap-2">
            <Link
              to="/help"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-border px-4 text-[13px] font-semibold text-text-secondary"
            >
              도움말
            </Link>
            <Link
              to="/result"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-[#24303F] px-4 text-[13px] font-semibold text-white"
            >
              최근 결과
            </Link>
          </div>
        </nav>
      ) : null}

      {isHome ? (
        <div className="border-t border-border/80 bg-bg-elevated/95">
          <div className="container mx-auto">
            <div className="no-scrollbar flex gap-2 overflow-x-auto px-sp-4 py-3">
              {homeFocusLinks.map((item) => {
                const isActive = currentSearch === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition-fast",
                      isActive
                        ? "border-[#24303F] bg-bg-subtle text-foreground"
                        : "border-border bg-bg-elevated text-text-secondary hover:bg-bg-subtle hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
