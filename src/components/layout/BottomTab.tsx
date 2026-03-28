import { Link, useLocation } from "react-router-dom";
import { Heart, Home, PenSquare, Star, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/routePrefetch";

const HOME_PATH = "/category/saju";

const tabs = [
  { label: "홈", path: HOME_PATH, icon: Home },
  { label: "내 사주", path: "/saju", icon: PenSquare },
  { label: "운세", path: "/fortune", icon: Star },
  { label: "궁합", path: "/love/couple-report", icon: Heart },
  { label: "다시보기", path: "/mypage", icon: FileText },
];

const isTabActive = (currentPath: string, targetPath: string) => {
  if (targetPath === "/") {
    return currentPath === "/";
  }
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
};

export function BottomTab() {
  const location = useLocation();
  const handlePrefetch = (path: string) => prefetchRoute(path);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-bottom-tab border-t border-border bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
    >
      <div className="grid h-[72px] grid-cols-5 items-center">
        {tabs.map((tab) => {
          const isActive = isTabActive(location.pathname, tab.path);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              onMouseEnter={() => handlePrefetch(tab.path)}
              onFocus={() => handlePrefetch(tab.path)}
              className={cn(
                "flex min-w-[44px] flex-col items-center justify-center gap-sp-1 px-sp-2 py-sp-2 transition-fast",
                isActive ? "text-primary" : "text-text-muted",
              )}
            >
              <Icon size={18} />
              <span className={cn("text-[11px] font-semibold", isActive ? "text-primary" : "text-text-muted")}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
