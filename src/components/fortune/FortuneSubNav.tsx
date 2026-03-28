import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

type FortuneNavItem = { label: string; path: string };

const DEFAULT_NAV_ITEMS: FortuneNavItem[] = [
  { label: "운세 허브", path: "/fortune" },
  { label: "오늘의 운세", path: "/fortune/personal" },
  { label: "2026 신년 운세", path: "/fortune/yearly" },
];

const toPathname = (path: string) => path.split("?")[0];

const isActivePath = (currentPath: string, targetPath: string) => {
  const normalizedTargetPath = toPathname(targetPath);

  if (normalizedTargetPath === "/fortune") {
    return currentPath === "/fortune";
  }

  return currentPath.startsWith(normalizedTargetPath);
};

export type FortuneSubNavProps = {
  items?: FortuneNavItem[];
};

export function FortuneSubNav({ items = DEFAULT_NAV_ITEMS }: FortuneSubNavProps) {
  const location = useLocation();

  return (
    <nav className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition-fast",
            isActivePath(location.pathname, item.path)
              ? "border-[#24303F] bg-bg-subtle text-foreground"
              : "border-border bg-bg-elevated text-text-secondary hover:bg-bg-subtle hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
