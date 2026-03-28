import { Outlet, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export const FunnelLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border bg-background/95 px-4 backdrop-blur">
        <button
          onClick={() => navigate(-1)}
          className="-ml-2 flex items-center justify-center rounded-full p-2 text-text-secondary transition-fast hover:bg-bg-subtle hover:text-foreground"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      </header>

      <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
};
