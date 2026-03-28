import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ServiceId, ServiceLandingData, getServiceLandingById } from "@/lib/serviceCatalog";

interface ServiceIntroScreenProps {
  serviceId: ServiceId;
  onStart: () => void;
  ctaText?: string;
}

const gradientByService = {
  saju: "from-[#1a223d] via-[#202a4b] to-[#2a3460]",
  astrology: "from-[#1f2848] via-[#2d3763] to-[#39467d]",
  love: "from-[#2d2142] via-[#352a4f] to-[#433064]",
} as const;

const FALLBACK_LANDING_BY_ID: Partial<Record<ServiceId, ServiceLandingData & { id: ServiceId }>> = {
  "saju-ai-chat": {
    id: "saju-ai-chat",
    title: "AI 사주 상담 (채팅)",
    description: "내 사주 정보를 기반으로 질문형 상담을 진행합니다.",
    badge: "핫",
    provider: "사주 인사이트 오리지널",
    priceText: "10회권 2,000원",
    nextPath: "/chat",
    serviceType: "saju",
    previewFeatures: [
      { title: "추천 질문 포함", description: "입력 질문과 추천 질문(보기) 모두 동일 규칙으로 차감됩니다." },
      { title: "owner 기준 동기화", description: "같은 연락처 owner는 브라우저가 달라도 잔여 횟수가 같습니다." },
    ],
  },
};

export const ServiceIntroScreen: React.FC<ServiceIntroScreenProps> = ({
  serviceId,
  onStart,
  ctaText = "분석 시작하기",
}) => {
  const resolvedLanding = getServiceLandingById(serviceId);
  const data = resolvedLanding ?? FALLBACK_LANDING_BY_ID[serviceId] ?? null;

  if (!data) {
    console.error(`ServiceIntroScreen: No data found for serviceId: ${serviceId}`);
    return null;
  }

  if (!resolvedLanding) {
    console.warn(`ServiceIntroScreen: fallback landing applied for serviceId: ${serviceId}`);
  }

  const gradientClass = gradientByService[data.serviceType] ?? gradientByService.saju;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto w-full max-w-3xl"
    >
      <Card className="overflow-hidden rounded-[28px] border border-border/70 bg-bg-elevated/90 shadow-lg">
        <div className={cn("relative overflow-hidden bg-gradient-to-br p-10", gradientClass)}>
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute -left-16 -top-24 h-64 w-64 rounded-full bg-accent-lavender/30 blur-3xl" />
            <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative z-10 mb-4 flex flex-wrap items-center gap-2"
          >
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[13px] font-bold text-white">
              {data.badge}
            </span>
            <span className="rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-[13px] font-bold text-primary">
              {data.priceText}
            </span>
            {data.audienceBadge ? (
              <span className="rounded-full border border-amber-200/30 bg-amber-300/15 px-3 py-1 text-[13px] font-bold text-amber-50">
                {data.audienceBadge}
              </span>
            ) : null}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="font-editorial text-3xl font-bold tracking-tight text-white"
          >
            {data.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.28 }}
            className="mt-3 max-w-2xl text-[18px] font-semibold leading-relaxed text-white drop-shadow-sm text-pretty"
          >
            {data.description}
          </motion.p>
        </div>

        <div className="space-y-7 p-8 md:p-10">
          {data.audienceNotice ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34 }}
              className="rounded-[20px] border border-amber-200/80 bg-amber-50/90 p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-amber-100 p-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[14px] font-extrabold text-amber-950">
                    {data.audienceBadge ?? "대상 안내"}
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-amber-900">
                    {data.audienceNotice}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}

          {data.previewFeatures?.length ? (
            <div className="space-y-4">
              <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] text-text-secondary">Included In Report</h4>
              <div className="grid gap-3">
                {data.previewFeatures.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + idx * 0.08 }}
                    className="analysis-card flex items-start gap-4"
                  >
                    <div className="rounded-full bg-bg-surface/70 p-1.5 text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="text-[15px] font-bold text-foreground">{feature.title}</h5>
                      <p className="mt-1 text-[14px] leading-relaxed text-text-secondary">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : null}

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }}>
            <Button
              onClick={onStart}
              className="cosmic-glow-gold h-14 w-full rounded-[16px] bg-primary text-[17px] font-extrabold text-primary-foreground transition-all hover:bg-primary-hover"
            >
              <span>{ctaText}</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};
