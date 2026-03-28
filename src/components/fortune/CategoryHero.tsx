import React from "react";
import { cn } from "@/lib/utils";

interface BannerConfig {
  label: string;
  title: string;
  description: string;
}

interface CategoryHeroProps {
  bannerConfig: BannerConfig;
  themeColor: string;
  videoSrc?: string;
  posterSrc?: string;
  videoObjectPosition?: string;
  videoObjectFit?: "cover" | "contain";
  minHeight?: string;
}

export const CategoryHero: React.FC<CategoryHeroProps> = ({
  bannerConfig,
  themeColor,
  videoSrc,
  posterSrc,
  videoObjectPosition,
  videoObjectFit = "cover",
  minHeight = "min-h-[360px]",
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
    <div className="px-4 py-6 md:px-0">
      <div
        className={cn(
          "relative flex flex-col items-center justify-between gap-10 overflow-hidden rounded-[40px] p-10 text-white shadow-2xl md:flex-row md:p-16",
          minHeight,
          hasMediaBackground && "bg-black",
          !hasMediaBackground &&
            themeColor === "accent-lavender" &&
            "bg-gradient-to-br from-[#CBB7F6]/90 to-[#A88DF0]/90 backdrop-blur-md",
          !hasMediaBackground &&
            themeColor === "accent-sky" &&
            "bg-gradient-to-br from-[#AFCFFF]/90 to-[#80AFFF]/90 backdrop-blur-md",
          !hasMediaBackground &&
            themeColor === "accent-mint" &&
            "bg-gradient-to-br from-[#AEE7D8]/90 to-[#7ED7C1]/90 backdrop-blur-md",
          !hasMediaBackground &&
            themeColor === "accent-pink" &&
            "bg-gradient-to-br from-[#F3B6C7]/90 to-[#EC94AD]/90 backdrop-blur-md",
          !hasMediaBackground &&
            !["accent-lavender", "accent-sky", "accent-mint", "accent-pink"].includes(themeColor) &&
            "bg-slate-800/90 backdrop-blur-md",
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
            <div className="absolute inset-0 bg-gradient-to-r from-[#24303F]/48 via-[#24303F]/28 to-[#24303F]/40" />
            <div className="absolute inset-0 bg-black/10" />
          </>
        ) : null}

        <div className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-xl text-center md:text-left">
          <div className="mb-6 flex flex-col items-center gap-4 md:flex-row md:items-start">
            <span className="inline-block rounded-full border border-white/20 bg-white/20 px-4 py-1.5 text-[13px] font-black uppercase tracking-widest text-white shadow-sm backdrop-blur-xl">
              {bannerConfig.label}
            </span>
          </div>

          <h2 className="mb-6 text-3xl font-black leading-tight tracking-tight text-white drop-shadow-sm md:text-5xl">
            {bannerConfig.title.split("\n").map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </h2>

          <p className="max-w-lg text-sm font-medium leading-relaxed text-white/90 md:text-xl">
            {bannerConfig.description}
          </p>
        </div>

        <div className="pointer-events-none absolute right-0 top-0 translate-x-1/3 -translate-y-1/3 transform opacity-10">
          <div className="flex h-96 w-96 items-center justify-center rounded-full border-[32px] border-white">
            <div className="h-64 w-64 rounded-full border-[16px] border-white/50" />
          </div>
        </div>
      </div>
    </div>
  );
};
