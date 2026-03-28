import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  FileText,
  Heart,
  Lightbulb,
  MoonStar,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/routePrefetch";
import { HOME_PATH, SIDEBAR_CATEGORY_GROUPS } from "@/data/mockData";

const categoryIconMap: Record<string, React.ReactNode> = {
  saju: <MoonStar className="h-5 w-5" />,
  astrology: <Sparkles className="h-5 w-5" />,
  love: <Heart className="h-5 w-5" />,
};

const getDefaultOpenIds = (pathname: string) =>
  SIDEBAR_CATEGORY_GROUPS.filter((category) =>
    category.items.some(
      (item) =>
        pathname === item.path || pathname.startsWith(`/category/${category.id}`),
    ),
  ).map((category) => category.id);

export const Sidebar = () => {
  const location = useLocation();
  const [openCategoryIds, setOpenCategoryIds] = React.useState<string[]>(() => {
    const initialOpen = getDefaultOpenIds(location.pathname);
    return initialOpen.length > 0 ? initialOpen : [SIDEBAR_CATEGORY_GROUPS[0].id];
  });

  React.useEffect(() => {
    const activeCategoryId = SIDEBAR_CATEGORY_GROUPS.find((category) =>
      category.items.some((item) => location.pathname === item.path),
    )?.id;

    if (!activeCategoryId) {
      return;
    }

    setOpenCategoryIds((prev) =>
      prev.includes(activeCategoryId) ? prev : [...prev, activeCategoryId],
    );
  }, [location.pathname]);

  const toggleCategory = (categoryId: string) => {
    setOpenCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((value) => value !== categoryId)
        : [...prev, categoryId],
    );
  };

  const handlePrefetch = (path: string) => {
    prefetchRoute(path);
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-white pt-4 text-foreground shadow-sm">
      <div className="mb-6 px-8">
        <Link
          to={HOME_PATH}
          className="flex items-center gap-2 text-xl font-bold tracking-tight"
          onMouseEnter={() => handlePrefetch(HOME_PATH)}
          onFocus={() => handlePrefetch(HOME_PATH)}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#24303F] text-[#C9A86A]">
            <MoonStar className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#24303F]">사주 인사이트</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="w-full space-y-2">
          {SIDEBAR_CATEGORY_GROUPS.map((category) => {
            const isOpen = openCategoryIds.includes(category.id);

            return (
              <section key={category.id} className="rounded-xl">
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-3 transition-all hover:bg-[#FAF7F2]"
                >
                  <div className="flex items-center gap-3 font-medium text-text-secondary">
                    {categoryIconMap[category.id]}
                    <span className="text-[15px]">{category.title}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-text-secondary transition-transform",
                      isOpen ? "rotate-180" : "rotate-0",
                    )}
                  />
                </button>

                {isOpen ? (
                  <div className="ml-10 mt-1 flex flex-col space-y-1 border-l border-border pl-5">
                    {category.items.map((item) => {
                      const isActive =
                        location.pathname + location.search === item.path ||
                        (location.pathname === item.path.split("?")[0] &&
                          !location.search &&
                          !item.path.includes("?"));

                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          onMouseEnter={() => handlePrefetch(item.path)}
                          onFocus={() => handlePrefetch(item.path)}
                          className={cn(
                            "rounded-md px-2 py-2 text-[14px] transition-colors",
                            isActive
                              ? "bg-[#EAF1F7] font-bold text-[#24303F]"
                              : "text-text-secondary hover:bg-[#FAF7F2] hover:text-foreground",
                          )}
                        >
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>

      <div className="mt-auto space-y-2 border-t border-border p-6">
        <Link
          to="/suggestions"
          onMouseEnter={() => handlePrefetch("/suggestions")}
          onFocus={() => handlePrefetch("/suggestions")}
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl p-3 text-[14px] font-medium transition-all",
            location.pathname === "/suggestions"
              ? "bg-[#EAF1F7] text-foreground"
              : "bg-white text-text-secondary hover:bg-[#FAF7F2] hover:text-foreground",
          )}
        >
          <div className="rounded-lg bg-[#FAF7F2] p-1.5 transition-all group-hover:bg-[#EAF1F7]">
            <Lightbulb className="h-4 w-4" />
          </div>
          의견 보내기
        </Link>

        <Link
          to="/mypage"
          onMouseEnter={() => handlePrefetch("/mypage")}
          onFocus={() => handlePrefetch("/mypage")}
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl p-3 text-[14px] font-medium transition-all",
            location.pathname === "/mypage"
              ? "bg-[#EAF1F7] text-foreground"
              : "bg-white text-text-secondary hover:bg-[#FAF7F2] hover:text-foreground",
          )}
        >
          <div className="rounded-lg bg-[#FAF7F2] p-1.5 transition-all group-hover:bg-[#EAF1F7]">
            <FileText className="h-4 w-4" />
          </div>
          리포트 다시보기
        </Link>

      </div>
    </div>
  );
};
