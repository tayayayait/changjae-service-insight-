import { GNB } from "./GNB";
import { BottomTab } from "./BottomTab";

interface AppLayoutProps {
  children: React.ReactNode;
  hideBottomNav?: boolean;
}

export function AppLayout({ children, hideBottomNav }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative">
      <GNB />
      <main className={!hideBottomNav ? "pb-[88px] md:pb-0" : ""}>
        {children}
      </main>
      {!hideBottomNav && <BottomTab />}
    </div>
  );
}
