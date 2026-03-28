import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getNewYearFortuneTiles } from "@/lib/serviceCatalog";

export function FortuneSpecialGrid() {
  const fortuneItems = getNewYearFortuneTiles();

  return (
    <div className="grid grid-cols-2 gap-5 p-1 sm:grid-cols-2 lg:grid-cols-3">
      {fortuneItems.map((item) => {
        const hasImage = !!item.imageUrl;

        return (
          <div key={item.serviceId}>
            <Link
              to={item.to}
              className={cn(
                "group relative flex flex-col items-center justify-center rounded-[32px] border overflow-hidden transition-all duration-500",
                "hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] active:scale-[0.98]",
                hasImage ? "min-h-[180px]" : "p-7",
                item.bgClass,
              )}
            >
              {/* 배경 이미지 레이어 */}
              {hasImage && (
                <div className="absolute inset-0 z-0">
                  <img
                    src={item.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-black/5" />
                </div>
              )}

              {/* 비이미지 배경 패턴 (폴백) */}
              {!hasImage && (
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                  <svg width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="grid-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M0 20h40M20 0v40" stroke="currentColor" strokeWidth="0.5" />
                      <circle cx="20" cy="20" r="2" fill="currentColor" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                  </svg>
                </div>
              )}

              {/* 콘텐츠 */}
              <div className={cn("relative z-10 flex flex-col items-center", hasImage && "p-7")}>

                
                <div className="text-center group-hover:translate-y-[-2px] transition-transform duration-300">
                  <span className={cn(
                    "block text-[15px] font-black tracking-tight md:text-[17px] mb-1",
                    hasImage ? "text-white drop-shadow-sm" : "text-gray-900"
                  )}>
                    {item.title}
                  </span>
                  <span className={cn(
                    "text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2 leading-relaxed px-4",
                    hasImage ? "text-white/90" : "text-gray-500"
                  )}>
                    {item.description}
                  </span>
                </div>
              </div>

              {/* 골드 라인 포인트 (호버 시 강조) */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-200/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 z-10" />
              
              {!hasImage && (
                <div className="pointer-events-none absolute inset-0 -z-10 rounded-[32px] bg-white opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              )}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
