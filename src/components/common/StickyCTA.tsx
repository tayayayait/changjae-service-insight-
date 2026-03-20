interface StickyCTAProps {
  children: React.ReactNode;
}

export function StickyCTA({ children }: StickyCTAProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-sticky-cta border-t border-slate-200 bg-white/95 px-4 pb-6 pt-4 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-lg" style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}>
        {children}
      </div>
    </div>
  );
}
