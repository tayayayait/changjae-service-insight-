import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "운세 허브", path: "/fortune" },
  { label: "오늘의 운세", path: "/fortune/personal" },
  { label: "2026 신년 운세", path: "/fortune/yearly" },
];

const isActivePath = (currentPath: string, targetPath: string) => {
  if (targetPath === "/fortune") {
    return currentPath === "/fortune";
  }

  return currentPath.startsWith(targetPath);
};

export function FortuneSubNav() {
  const location = useLocation();

  return (
    <nav className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto pb-1">
      {NAV_ITEMS.map((item) => (
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
