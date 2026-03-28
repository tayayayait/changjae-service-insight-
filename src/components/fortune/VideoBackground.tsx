import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface VideoBackgroundProps {
  src: string;
  poster?: string;
  overlayOpacity?: number;
  blurAmount?: string;
  objectPosition?: string;
  className?: string;
  isLightMode?: boolean;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
  src,
  poster,
  overlayOpacity = 0.5,
  blurAmount = "0px",
  objectPosition = "center",
  className,
  isLightMode = false,
}) => {
  const videoRef1 = useRef<HTMLVideoElement>(null);
  const videoRef2 = useRef<HTMLVideoElement>(null);
  const [activeVideo, setActiveVideo] = useState<1 | 2>(1);
  const [opacity1, setOpacity1] = useState(0.8);
  const [opacity2, setOpacity2] = useState(0);
  const fadeDuration = 1.5; // seconds
  const isWebP = src.toLowerCase().endsWith('.webp');

  useEffect(() => {
    const video1 = videoRef1.current;
    const video2 = videoRef2.current;
    
    if (video1) {
      video1.playbackRate = 0.8;
      video1.play().catch(() => {});
    }
    if (video2) video2.playbackRate = 0.8;

    let rafId: number;
    
    const checkLoop = () => {
      const activeRef = activeVideo === 1 ? video1 : video2;
      const nextRef = activeVideo === 1 ? video2 : video1;
      
      if (activeRef && nextRef && activeRef.duration > 0) {
        const remainingTime = activeRef.duration - activeRef.currentTime;
        
        // 페이드 시작 타이밍 (종료 fadeDuration 초 전)
        if (remainingTime <= fadeDuration && (activeVideo === 1 ? opacity2 === 0 : opacity1 === 0) && activeRef.currentTime > 0) {
          // 다음 비디오 준비 및 재생 시작
          nextRef.currentTime = 0;
          nextRef.play().catch(() => {});
          
          // 페이드 애니메이션 시작
          if (activeVideo === 1) {
            setOpacity1(0);
            setOpacity2(0.8);
          } else {
            setOpacity1(0.8);
            setOpacity2(0);
          }
          
          // 활성 비디오 교체 예약
          setTimeout(() => {
            setActiveVideo(prev => prev === 1 ? 2 : 1);
            activeRef.pause();
            activeRef.currentTime = 0;
          }, fadeDuration * 1000);
        }
      }
      rafId = requestAnimationFrame(checkLoop);
    };

    if (!isWebP) {
      rafId = requestAnimationFrame(checkLoop);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [activeVideo, src, isWebP, opacity1, opacity2]);

  return (
    <div className={cn(
      "absolute inset-0 overflow-hidden",
      isLightMode ? "bg-slate-50" : "bg-slate-950",
      className
    )}>
      <div 
        className="absolute inset-y-0 right-0 w-full md:w-[65%] pointer-events-none transition-all duration-1000"
        style={{
          maskImage: 'linear-gradient(to left, black 40%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to left, black 40%, transparent 95%)'
        }}
      >
        {isWebP ? (
          <img 
            src={src} 
            alt="background"
            className="absolute inset-0 h-full w-full object-cover opacity-80"
            style={{ 
              filter: `blur(${blurAmount})`,
              objectPosition: objectPosition
            }}
          />
        ) : (
          <>
            <video
              ref={videoRef1}
              muted
              playsInline
              autoPlay
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms]"
              style={{ 
                filter: `blur(${blurAmount})`,
                objectPosition: objectPosition,
                opacity: opacity1
              }}
            >
              <source src={src} type={src.endsWith('.webm') ? "video/webm" : "video/mp4"} />
            </video>

            <video
              ref={videoRef2}
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms]"
              style={{ 
                filter: `blur(${blurAmount})`,
                objectPosition: objectPosition,
                opacity: opacity2
              }}
            >
              <source src={src} type={src.endsWith('.webm') ? "video/webm" : "video/mp4"} />
            </video>
          </>
        )}
      </div>
      
      {/* 텍스트 가독성을 위한 레이어드 오버레이 */}
      <div className={cn(
        "absolute inset-x-0 inset-y-0 pointer-events-none transition-colors duration-1000",
        isLightMode 
          ? "bg-gradient-to-r from-white/90 via-white/40 to-transparent" 
          : "bg-gradient-to-r from-slate-950 via-slate-950/20 to-transparent"
      )} />
      
      <div className={cn(
        "absolute inset-x-0 top-0 h-48 pointer-events-none transition-colors duration-1000",
        isLightMode 
          ? "bg-gradient-to-b from-white to-transparent" 
          : "bg-gradient-to-b from-slate-950 to-transparent"
      )} />
      <div className={cn(
        "absolute inset-x-0 bottom-0 h-48 pointer-events-none transition-colors duration-1000",
        isLightMode 
          ? "bg-gradient-to-t from-white to-transparent" 
          : "bg-gradient-to-t from-slate-950 to-transparent"
      )} />
    </div>
  );
};
