import React from "react";
import { cn } from "@/lib/utils";

interface BannerConfig {
  label: string;
  title: string;
  description: string;
}

interface CategorySideHeroProps {
  bannerConfig: BannerConfig;
  themeColor: string;
  videoSrc?: string;
  posterSrc?: string;
  videoObjectPosition?: string;
  videoObjectFit?: "cover" | "contain";
}

export const CategorySideHero: React.FC<CategorySideHeroProps> = ({
  bannerConfig,
  themeColor,
  videoSrc,
  posterSrc,
  videoObjectPosition = "center",
  videoObjectFit = "cover",
}) => {
  const hasMediaBackground = Boolean(videoSrc);
  const [isVideoReady, setIsVideoReady] = React.useState(false);

  React.useEffect(() => {
    if (!videoSrc) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsVideoReady(true);
    }, 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, [videoSrc]);

  const shouldRenderVideo = hasMediaBackground && isVideoReady;

  return (
    <div
      className={cn(
        "sticky top-24 flex h-[calc(100vh-120px)] w-80 shrink-0 flex-col overflow-hidden rounded-[32px] border border-white/10 text-white shadow-2xl",
        hasMediaBackground && "bg-black",
        !hasMediaBackground && "bg-slate-900",
        themeColor === "accent-pink" && "shadow-pink-100/20",
      )}
    >
      {posterSrc && !shouldRenderVideo ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${posterSrc})` }}
          aria-hidden="true"
        />
      ) : null}
      {shouldRenderVideo ? (
        <>
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            poster={posterSrc}
            className={cn(
              "absolute inset-0 h-full w-full object-center",
              videoObjectFit === "cover" ? "object-cover" : "object-contain",
            )}
            style={videoObjectPosition ? { objectPosition: videoObjectPosition } : undefined}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        </>
      ) : null}

      <div className="relative z-10 flex h-full flex-col p-8">
        <div className="flex-1">
          <span className="mb-4 inline-block rounded-full border border-white/20 bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-xl">
            {bannerConfig.label}
          </span>
          <h2 className="mb-4 text-2xl font-black leading-tight drop-shadow-md">
            {bannerConfig.title.split("\n").map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </h2>
          <p className="line-clamp-4 text-sm font-medium leading-relaxed text-white/80">
            {bannerConfig.description}
          </p>
        </div>
      </div>
    </div>
  );
};
