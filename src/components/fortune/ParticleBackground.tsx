import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

interface ParticleBackgroundProps {
  isLightMode?: boolean;
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ isLightMode = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticle = (): Particle => {
      // 우측(소나무 위치)에서 생성되어 좌측으로 흩날리는 느낌
      const isRightSource = Math.random() > 0.3;
      const x = isRightSource ? canvas.width * (0.6 + Math.random() * 0.4) : Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      
      return {
        x,
        y,
        size: Math.random() * 2.5 + 0.5,
        speedX: -(Math.random() * 0.8 + 0.2), // 좌측으로 서서히 이동
        speedY: (Math.random() - 0.5) * 0.3, // 위아래로 미세한 흔들림
        opacity: Math.random() * 0.5 + 0.2,
        color: isLightMode 
          ? `rgba(${180 + Math.random() * 40}, ${140 + Math.random() * 40}, ${40 + Math.random() * 40}, ` // 진한 금빛/갈색조
          : `rgba(${255}, ${200 + Math.random() * 55}, ${50 + Math.random() * 100}, `, // 밝은 황금빛
      };
    };

    const init = () => {
      particles = Array.from({ length: 60 }, createParticle);
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;
        
        // 화면 밖으로 나가면 반대편 또는 우측에서 재생성
        if (p.x < -10) {
          particles[i] = createParticle();
          particles[i].x = canvas.width + 10;
        }
        if (p.y < -10 || p.y > canvas.height + 10) {
          p.y = (p.y + canvas.height) % canvas.height;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.opacity + ")";
        ctx.shadowBlur = p.size * 2;
        ctx.shadowColor = "rgba(255, 215, 0, 0.4)";
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    resize();
    init();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "pointer-events-none fixed inset-0 z-[5] transition-opacity duration-1000",
        isLightMode ? "opacity-40 mix-blend-multiply" : "opacity-60 mix-blend-screen"
      )}
    />
  );
};
