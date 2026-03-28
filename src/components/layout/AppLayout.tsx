import { GNB } from "./GNB";
import { BottomTab } from "./BottomTab";
import { Footer } from "./Footer";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  hideBottomNav?: boolean;
  hideFooter?: boolean;
  showVideoBackground?: boolean;
}

export function AppLayout({ children, hideBottomNav, hideFooter }: AppLayoutProps) {
  return (
    <div className={cn("relative min-h-screen bg-background flex flex-col")}>
      <div className="relative z-10 flex-grow">
        <GNB />
        <main className={cn(!hideBottomNav ? "pb-[88px] md:pb-0" : "")}>{children}</main>
        {!hideBottomNav ? <BottomTab /> : null}
      </div>
      {!hideFooter ? <Footer /> : null}
    </div>
  );
}
