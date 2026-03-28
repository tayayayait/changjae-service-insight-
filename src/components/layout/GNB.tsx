import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, MoonStar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/routePrefetch";
import { GLOBAL_NAV_ITEMS, HOME_FOCUS_LINKS, HOME_PATH } from "@/data/mockData";
import { useOwnerStore } from "@/store/useOwnerStore";

const isRouteActive = (currentPath: string, targetPath: string) => {
  if (targetPath === "/") {
    return currentPath === "/";
  }
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
};

export function GNB() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const resetToGuestOwner = useOwnerStore((state) => state.resetToGuestOwner);
  const isHome = location.pathname === "/";
  const hideTopNavigation = location.pathname === "/saju";
  const currentSearch = `${location.pathname}${location.search}`;

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleDeleteData = () => {
    if (window.confirm("기기에 저장된 모든 리포트 조회 기록을 삭제하시겠습니까?")) {
      resetToGuestOwner();
      alert("조회 기록이 삭제되었습니다.");
      window.location.reload();
    }
  };

  const handlePrefetch = (path: string) => {
    prefetchRoute(path);
  };

  return (
    <header className="sticky top-0 z-gnb border-b border-border bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-sp-4">
        <Link
          to={HOME_PATH}
          className="flex items-center gap-sp-3"
          onMouseEnter={() => handlePrefetch(HOME_PATH)}
          onFocus={() => handlePrefetch(HOME_PATH)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#24303F] text-[#C9A86A]">
            <MoonStar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-title font-editorial text-foreground">사주 인사이트</span>
            <span className="block text-[11px] font-semibold text-text-secondary">
              Premium Wellness Editorial
            </span>
          </div>
        </Link>

        {!hideTopNavigation ? (
          <>
            <nav className="hidden items-center gap-sp-6 md:flex">
              {GLOBAL_NAV_ITEMS.map((item) => (
                item.path === "#delete" ? (
                  <button
                    key={item.label}
                    onClick={handleDeleteData}
                    className="text-button font-medium text-text-secondary transition-fast hover:text-red-500"
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    onMouseEnter={() => handlePrefetch(item.path)}
                    onFocus={() => handlePrefetch(item.path)}
                    className={cn(
                      "text-button transition-fast hover:text-foreground",
                      isRouteActive(location.pathname, item.path)
                        ? "text-primary font-bold"
                        : "text-text-secondary font-medium",
                    )}
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/help"
                onMouseEnter={() => handlePrefetch("/help")}
                onFocus={() => handlePrefetch("/help")}
                className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-white px-4 text-[13px] font-semibold text-text-secondary transition-fast hover:bg-bg-subtle hover:text-foreground"
              >
                문의하기
              </Link>
            </div>

            <button
              className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-white md:hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </>
        ) : null}
      </div>

      {!hideTopNavigation && menuOpen ? (
        <nav className="border-t border-border bg-background px-sp-4 py-sp-4 md:hidden">
          {GLOBAL_NAV_ITEMS.map((item) => (
            item.path === "#delete" ? (
              <button
                key={item.label}
                onClick={() => {
                  setMenuOpen(false);
                  handleDeleteData();
                }}
                className="block w-full text-left rounded-md px-sp-4 py-sp-3 text-button font-medium text-text-secondary transition-fast hover:bg-red-50 hover:text-red-600"
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                onMouseEnter={() => handlePrefetch(item.path)}
                onFocus={() => handlePrefetch(item.path)}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "block rounded-md px-sp-4 py-sp-3 text-button font-medium transition-fast",
                  isRouteActive(location.pathname, item.path)
                    ? "bg-bg-subtle text-primary font-bold"
                    : "text-text-secondary hover:bg-bg-subtle hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            )
          ))}
          <div className="mt-4 flex gap-2">
            <Link
              to="/help"
              onMouseEnter={() => handlePrefetch("/help")}
              onFocus={() => handlePrefetch("/help")}
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-border px-4 text-[13px] font-semibold text-text-secondary"
            >
              문의하기
            </Link>
          </div>
        </nav>
      ) : null}

      {isHome ? (
        <div className="border-t border-border bg-background">
          <div className="container mx-auto">
            <div className="no-scrollbar flex gap-2 overflow-x-auto px-sp-4 py-3">
              {HOME_FOCUS_LINKS.map((item) => {
                const isActive = currentSearch === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onMouseEnter={() => handlePrefetch(item.path)}
                    onFocus={() => handlePrefetch(item.path)}
                    className={cn(
                      "shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition-fast",
                      isActive
                        ? "border-primary/70 bg-primary/10 text-primary"
                        : "border-border bg-white text-text-secondary hover:bg-bg-subtle hover:text-foreground",
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
