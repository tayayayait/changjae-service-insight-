import React from "react";
import { SajuTrendPointEvidence } from "@/types/result";
import { cn } from "@/lib/utils";

interface DataPoint {
  label: string;
  value: number;
}

export interface SajuTrendDomainPoint {
  label: string;
  position: number;
}

export type IndexBandLabel = "주의" | "보통·관리 필요" | "양호·확장 가능" | "강한 흐름·과속 주의";
export type StatusLabel = "유지 구간" | "확장 가능" | "회복 우선" | "변동 주의";

export interface BeginnerTrendExplanation {
  statusLabel: StatusLabel;
  plainMeaning: string;
  whyChanged: string;
  doNow: string;
  avoidNow: string;
  indexBandLabel: IndexBandLabel;
}

interface SajuTrendChartProps {
  data: DataPoint[];
  evidence?: SajuTrendPointEvidence[];
  title?: string;
  color?: string;
  className?: string;
  domain?: SajuTrendDomainPoint[];
  periodSummary?: string;
  pointSummary?: string;
  description?: string;
}

type TrendDomainKind = "wealth" | "energy";

const normalizeLabel = (value: string) => value.replace(/\s+/g, "").toLowerCase();
const toSignedValue = (value: number) => `${value >= 0 ? "+" : ""}${value}`;

const TERM_GLOSSARY = [
  "세운(그 해의 흐름)",
  "월운(그 달의 흐름)",
  "일진(그날의 컨디션 흐름)",
  "용신(균형을 보완하는 핵심 기운)",
  "오행(기운의 구성)",
].join(" / ");

const INDEX_BAND_GUIDE: Array<{ min: number; max: number; label: IndexBandLabel; tone: string }> = [
  { min: 0, max: 39, label: "주의", tone: "bg-rose-50 text-rose-700 border-rose-100" },
  { min: 40, max: 59, label: "보통·관리 필요", tone: "bg-amber-50 text-amber-700 border-amber-100" },
  { min: 60, max: 74, label: "양호·확장 가능", tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { min: 75, max: 100, label: "강한 흐름·과속 주의", tone: "bg-indigo-50 text-indigo-700 border-indigo-100" },
];

const STATUS_TONE: Record<StatusLabel, string> = {
  "유지 구간": "bg-slate-50 text-slate-700 border-slate-200",
  "확장 가능": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "회복 우선": "bg-violet-50 text-violet-700 border-violet-100",
  "변동 주의": "bg-rose-50 text-rose-700 border-rose-100",
};

export const getIndexBandLabel = (value: number): IndexBandLabel =>
  INDEX_BAND_GUIDE.find((band) => value >= band.min && value <= band.max)?.label ?? "보통·관리 필요";

const getDomainKind = (evidence: SajuTrendPointEvidence): TrendDomainKind =>
  evidence.rawBasis.checkpoint.unit === "year" ? "wealth" : "energy";

const hasLargeChange = (delta: number) => Math.abs(delta) >= 10;

const resolveStatusLabel = (evidence: SajuTrendPointEvidence): StatusLabel => {
  const domain = getDomainKind(evidence);
  const { direction, deltaFromPrev, value } = evidence;

  if (hasLargeChange(deltaFromPrev)) {
    return "변동 주의";
  }

  if (domain === "wealth") {
    if (direction === "up" && value >= 60) return "확장 가능";
    if (direction === "flat") return "유지 구간";
    return "변동 주의";
  }

  if (direction === "down" && value < 55) return "회복 우선";
  if (direction === "up" && value >= 60) return "확장 가능";
  if (direction === "flat") return "유지 구간";
  return "변동 주의";
};

const buildWhyChanged = (evidence: SajuTrendPointEvidence, domain: TrendDomainKind): string => {
  const factors = evidence.rawBasis.factorScores ?? {};

  if (domain === "wealth") {
    const seunAdjustment = Number(factors.seunAdjustment ?? 0);
    const inflowPower = Number(factors.inflowPower ?? 0);
    const leakagePower = Number(factors.leakagePower ?? 0);
    const flowGap = inflowPower - leakagePower;

    if (seunAdjustment >= 4) {
      return `세운(그 해의 흐름) 보정이 +${seunAdjustment}로 강하게 작동해 상승 탄력이 붙었습니다.`;
    }
    if (seunAdjustment <= -4) {
      return `세운(그 해의 흐름) 보정이 ${seunAdjustment}로 작동해 방어 압력이 커졌습니다.`;
    }
    if (flowGap >= 12) {
      return `오행(기운의 구성) 기준 유입 점수(${inflowPower})가 누수 점수(${leakagePower})보다 커 안정적 확장 신호가 유지됩니다.`;
    }
    if (flowGap <= 2) {
      return `유입과 누수의 격차가 작아 변동성이 커질 수 있는 구간입니다.`;
    }
    return `유입 우위는 유지되지만 격차가 크지 않아 속도 조절이 필요한 구간입니다.`;
  }

  const temporalAdjustment = Number(factors.temporalAdjustment ?? 0);
  const focusPower = Number(factors.focusPower ?? 0);
  const recoveryPower = Number(factors.recoveryPower ?? 0);
  const fatiguePressure = Number(factors.fatiguePressure ?? 0);

  if (temporalAdjustment >= 3) {
    return `일진(그날의 컨디션 흐름) 보정이 +${temporalAdjustment}로 들어와 단기 회복력이 보강되었습니다.`;
  }
  if (temporalAdjustment <= -3) {
    return `일진(그날의 컨디션 흐름) 보정이 ${temporalAdjustment}로 작용해 컨디션 하방 압력이 커졌습니다.`;
  }
  if (recoveryPower >= focusPower + 4) {
    return `회복 점수(${recoveryPower})가 집중 점수(${focusPower})보다 높아 체력 재정비가 우선되는 리듬입니다.`;
  }
  if (fatiguePressure >= focusPower) {
    return `피로 압력(${fatiguePressure})이 집중 점수(${focusPower})와 비슷하거나 높아 과부하 위험이 커졌습니다.`;
  }
  return `집중·회복 균형이 유지되지만 주간 페이스 관리가 성과를 좌우합니다.`;
};

const buildPlainMeaning = (
  evidence: SajuTrendPointEvidence,
  statusLabel: StatusLabel,
  bandLabel: IndexBandLabel,
  domain: TrendDomainKind,
): string => {
  const { direction, deltaFromPrev } = evidence;
  const largeChange = hasLargeChange(deltaFromPrev);

  if (statusLabel === "회복 우선") {
    return "현재는 에너지 저점 관리 구간입니다. 회복을 먼저 확보해야 다음 상승을 안전하게 받습니다.";
  }
  if (statusLabel === "유지 구간") {
    return direction === "flat"
      ? `흐름이 크게 흔들리지 않는 유지 구간입니다. (${bandLabel})`
      : `큰 방향 전환 없이 관리가 필요한 구간입니다. (${bandLabel})`;
  }
  if (statusLabel === "확장 가능") {
    if (largeChange && direction === "up") {
      return "상승 폭이 크지만 과속하면 되돌림이 생길 수 있어 통제된 확장이 필요합니다.";
    }
    if (domain === "wealth") {
      return "재물 흐름이 양호해 확장 기회가 열리는 구간입니다.";
    }
    return "집중 리듬이 살아나는 구간이라 핵심 과제 추진 효율이 올라갑니다.";
  }
  if (direction === "down") {
    return "하락 변동이 확인되어 방어와 속도 조절이 필요한 구간입니다.";
  }
  if (direction === "up") {
    return "상승 신호는 있으나 변동성도 커서 단계별 실행이 필요한 구간입니다.";
  }
  return "방향성은 약하지만 변동 요인이 커 보수적 운영이 유리합니다.";
};

const buildDoNow = (
  evidence: SajuTrendPointEvidence,
  statusLabel: StatusLabel,
  domain: TrendDomainKind,
): string => {
  const { direction, value } = evidence;
  if (domain === "wealth") {
    if (statusLabel === "확장 가능" && value >= 75) return "확장 전 한도(예산/손실)를 숫자로 먼저 고정하세요.";
    if (statusLabel === "확장 가능") return "수입 채널 1개를 추가하되 고정비 증액은 한 단계씩 진행하세요.";
    if (statusLabel === "유지 구간") return "월별 현금흐름 점검표를 유지하고 누수 항목만 우선 정리하세요.";
    if (direction === "down") return "방어 자금 비중을 먼저 높이고 신규 확장 결정을 미루세요.";
    return "상승분 일부를 안전 자산으로 잠가 변동성을 줄이세요.";
  }

  if (statusLabel === "회복 우선") return "이번 주는 수면·회복 블록을 먼저 배치하고 작업 강도를 낮추세요.";
  if (statusLabel === "확장 가능" && value >= 75) return "핵심 과제 1~2개에 집중해 몰입 시간을 길게 확보하세요.";
  if (statusLabel === "확장 가능") return "몰입 작업을 오전 고정 시간에 배치해 상승 흐름을 활용하세요.";
  if (statusLabel === "유지 구간") return "현재 루틴을 유지하면서 주간 과부하 체크를 함께 기록하세요.";
  return "강도 높은 일정은 줄이고 회복 루틴을 먼저 복구하세요.";
};

const buildAvoidNow = (
  evidence: SajuTrendPointEvidence,
  statusLabel: StatusLabel,
  domain: TrendDomainKind,
): string => {
  const { direction, deltaFromPrev } = evidence;
  if (domain === "wealth") {
    if (statusLabel === "확장 가능") return "상승 신호만 믿고 레버리지·고정 지출을 동시에 늘리지 마세요.";
    if (statusLabel === "유지 구간") return "점검 없는 자동 지출 확대를 방치하지 마세요.";
    if (direction === "down" || hasLargeChange(deltaFromPrev)) return "변동 구간에서 장기 고정 지출을 새로 확정하지 마세요.";
    return "근거 없이 단기 수익 판단을 반복하지 마세요.";
  }

  if (statusLabel === "회복 우선") return "야간 고강도 작업을 연속 배치하지 마세요.";
  if (statusLabel === "확장 가능") return "동시다발 과제 확장으로 집중력을 분산시키지 마세요.";
  if (statusLabel === "유지 구간") return "루틴을 자주 바꿔 리듬을 깨지 마세요.";
  return "컨디션 하락 구간에서 무리한 일정 강행을 피하세요.";
};

export const buildBeginnerTrendExplanation = (evidence: SajuTrendPointEvidence): BeginnerTrendExplanation => {
  const domain = getDomainKind(evidence);
  const indexBandLabel = getIndexBandLabel(evidence.value);
  const statusLabel = resolveStatusLabel(evidence);

  return {
    statusLabel,
    plainMeaning: buildPlainMeaning(evidence, statusLabel, indexBandLabel, domain),
    whyChanged: buildWhyChanged(evidence, domain),
    doNow: buildDoNow(evidence, statusLabel, domain),
    avoidNow: buildAvoidNow(evidence, statusLabel, domain),
    indexBandLabel,
  };
};

const renderRawBasis = (evidence: SajuTrendPointEvidence) => {
  const { rawBasis } = evidence;
  const oheng = rawBasis.ohengDistribution;

  return (
    <div className="mt-2 space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700">
      <p>
        <span className="font-bold text-slate-900">기준 시점:</span> {rawBasis.checkpoint.label} ({rawBasis.checkpoint.targetDate})
      </p>
      <p>
        <span className="font-bold text-slate-900">오행(기운의 구성) 분포:</span>{" "}
        목 {oheng.목}% / 화 {oheng.화}% / 토 {oheng.토}% / 금 {oheng.금}% / 수 {oheng.수}%
      </p>
      <p>
        <span className="font-bold text-slate-900">용신(균형을 보완하는 핵심 기운):</span>{" "}
        {rawBasis.yongsin.length > 0 ? rawBasis.yongsin.join(", ") : "없음"}
      </p>
      {rawBasis.seun && (
        <p>
          <span className="font-bold text-slate-900">세운(그 해의 흐름):</span>{" "}
          {rawBasis.seun.year}년 {rawBasis.seun.pillar} ({rawBasis.seun.element})
        </p>
      )}
      {rawBasis.temporalPillars && (
        <p>
          <span className="font-bold text-slate-900">세운/월운/일진:</span>{" "}
          {rawBasis.temporalPillars.yearPillar}({rawBasis.temporalPillars.yearElement}) /{" "}
          {rawBasis.temporalPillars.monthPillar}({rawBasis.temporalPillars.monthElement}) /{" "}
          {rawBasis.temporalPillars.dayPillar}({rawBasis.temporalPillars.dayElement})
        </p>
      )}
      <p className="pt-1 text-[10px] text-slate-500">{TERM_GLOSSARY}</p>
    </div>
  );
};

export const SajuTrendChart: React.FC<SajuTrendChartProps> = ({
  data,
  evidence,
  title,
  color = "#6366f1",
  className,
  domain,
  periodSummary,
  pointSummary,
  description,
}) => {
  if (!data || data.length === 0) return null;

  const ticks = (domain && domain.length > 0
    ? [...domain].sort((a, b) => a.position - b.position)
    : data.map((point, index) => ({ label: point.label, position: index }))) as SajuTrendDomainPoint[];

  const valueByLabel = new Map(data.map((point) => [normalizeLabel(point.label), point.value]));
  const allMappedByLabel = ticks.every((tick) => valueByLabel.has(normalizeLabel(tick.label)));

  const points = ticks.map((tick, index) => ({
    label: tick.label,
    position: tick.position,
    value: allMappedByLabel ? valueByLabel.get(normalizeLabel(tick.label)) ?? null : data[index]?.value ?? null,
  }));

  const availablePoints = points.filter((point): point is typeof point & { value: number } => typeof point.value === "number");
  if (availablePoints.length === 0) return null;

  const width = 680;
  const height = 220;
  const paddingTop = 20;
  const paddingRight = 22;
  const paddingBottom = 42;
  const paddingLeft = 22;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...availablePoints.map((point) => point.value), 100);
  const minVal = Math.min(...availablePoints.map((point) => point.value), 0);
  const range = maxVal - minVal || 1;
  const minPos = ticks[0]?.position ?? 0;
  const maxPos = ticks[ticks.length - 1]?.position ?? 1;
  const posRange = maxPos - minPos || 1;
  const chartBottomY = height - paddingBottom;

  const toX = (position: number) => paddingLeft + ((position - minPos) / posRange) * chartWidth;
  const toY = (value: number) => chartBottomY - ((value - minVal) / range) * chartHeight;
  const linePoints = availablePoints.map((point) => `${toX(point.position)},${toY(point.value)}`).join(" ");
  const firstDataX = toX(availablePoints[0].position);
  const lastDataX = toX(availablePoints[availablePoints.length - 1].position);
  const noDataTicks = points.filter((point) => point.value === null);
  const hasNoData = noDataTicks.length > 0;

  const defaultPeriodSummary = `${ticks[0]?.label ?? "start"} ~ ${ticks[ticks.length - 1]?.label ?? "end"}`;
  const defaultPointSummary = availablePoints.map((point) => point.label).join(" / ");
  const areaPoints = `${firstDataX},${chartBottomY} ${linePoints} ${lastDataX},${chartBottomY}`;

  const evidenceMap = new Map((evidence ?? []).map((item) => [normalizeLabel(item.label), item]));
  const cards = ticks
    .map((tick) => {
      const matched = evidenceMap.get(normalizeLabel(tick.label));
      if (!matched) return null;
      return {
        evidence: matched,
        explanation: buildBeginnerTrendExplanation(matched),
      };
    })
    .filter((item): item is { evidence: SajuTrendPointEvidence; explanation: BeginnerTrendExplanation } => Boolean(item));
  const startPoint = availablePoints[0];
  const startPointBand = getIndexBandLabel(startPoint.value);

  return (
    <div className={cn("w-full rounded-3xl border border-stone-100 bg-white p-6 dark:border-stone-800 dark:bg-stone-900", className)}>
      {title && <h4 className="mb-2 text-sm font-black text-stone-900 dark:text-stone-100">{title}</h4>}
      <p className="mb-3 text-[12px] font-medium text-slate-600">{description}</p>

      <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
        <p className="mb-1 text-[11px] font-bold text-slate-900">지수 구간 의미</p>
        <div className="flex flex-wrap gap-1.5">
          {INDEX_BAND_GUIDE.map((band) => (
            <span key={band.label} className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", band.tone)}>
              {band.min}~{band.max} {band.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2">
        <p className="text-[11px] font-bold text-slate-600">{startPoint.label} 지수</p>
        <p className="text-sm font-black text-slate-900">
          {startPoint.value} <span className="text-xs font-semibold text-slate-500">({startPointBand})</span>
        </p>
      </div>

      <div className="relative h-[230px]">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <rect x={paddingLeft} y={paddingTop} width={chartWidth} height={chartHeight} fill="#f8fafc" />

          <rect
            x={firstDataX}
            y={paddingTop}
            width={Math.max(1, lastDataX - firstDataX)}
            height={chartHeight}
            fill={`${color}10`}
          />

          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="#e2e8f0" strokeWidth="1" />
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight / 2}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight / 2}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
          <line
            x1={paddingLeft}
            y1={chartBottomY}
            x2={width - paddingRight}
            y2={chartBottomY}
            stroke="#e2e8f0"
            strokeWidth="1"
          />

          <polyline points={areaPoints} fill={`${color}12`} />
          <polyline points={linePoints} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {availablePoints.map((point, index) => {
            const x = toX(point.position);
            const y = toY(point.value);
            return (
              <g key={`${point.label}-${index}`}>
                <text x={x} y={y - 10} textAnchor="middle" className="fill-slate-700 text-[10px] font-bold">
                  {point.value}
                </text>
                <circle cx={x} cy={y} r="4" fill="white" stroke={color} strokeWidth="2" />
                <circle cx={x} cy={y} r="11" fill="transparent" />
              </g>
            );
          })}

          {noDataTicks.map((tick, index) => {
            const x = toX(tick.position);
            return (
              <g key={`no-data-${tick.label}-${index}`}>
                <line x1={x} y1={paddingTop} x2={x} y2={chartBottomY} stroke="#cbd5e1" strokeDasharray="3 4" />
                <circle cx={x} cy={chartBottomY} r="3" fill="#e2e8f0" stroke="#94a3b8" />
              </g>
            );
          })}

          {ticks.map((tick, index) => {
            const x = toX(tick.position);
            return (
              <text
                key={`label-${tick.label}-${index}`}
                x={x}
                y={height - 14}
                textAnchor="middle"
                className="fill-stone-400 text-[10px] font-bold"
              >
                {tick.label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 space-y-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
        <p>
          <span className="font-bold text-slate-900">Range:</span> {periodSummary ?? defaultPeriodSummary}
        </p>
        <p>
          <span className="font-bold text-slate-900">Checkpoints:</span> {pointSummary ?? defaultPointSummary}
        </p>
        {hasNoData && <p className="text-slate-500">점선 구간은 예측 없음/분석 구간 아님/데이터 없음입니다.</p>}
        <p className="text-slate-500">{TERM_GLOSSARY}</p>
      </div>

      <div className="mt-3 rounded-xl border border-slate-100 bg-white px-3 py-2">
        <p className="mb-1 text-[11px] font-bold text-slate-600">시점별 지수</p>
        <div className="flex flex-wrap gap-2">
          {availablePoints.map((point) => (
            <span key={`score-chip-${point.label}`} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
              {point.label} {point.value}
            </span>
          ))}
        </div>
      </div>

      {cards.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {cards.map(({ evidence: item, explanation }) => (
            <article key={`trend-card-${item.label}`} className="rounded-xl border border-slate-100 bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[12px] font-black text-slate-900">{item.label}</p>
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", STATUS_TONE[explanation.statusLabel])}>
                  {explanation.statusLabel}
                </span>
              </div>

              <div className="mb-2 flex items-center gap-2 text-[12px]">
                <span className="font-semibold text-slate-700">지수 {item.value}</span>
                <span className="text-slate-500">({explanation.indexBandLabel})</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  {toSignedValue(item.deltaFromPrev)}
                </span>
              </div>

              <p className="text-[12px] font-medium text-slate-700">{explanation.plainMeaning}</p>
              <p className="mt-1 text-[12px] text-slate-700">
                <span className="font-bold text-slate-900">지금 할 일:</span> {explanation.doNow}
              </p>

              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] font-bold text-slate-700">근거 보기</summary>
                <div className="mt-2 space-y-1 text-[12px] text-slate-700">
                  <p>
                    <span className="font-bold text-slate-900">왜 변했는지:</span> {explanation.whyChanged}
                  </p>
                  <p>
                    <span className="font-bold text-slate-900">피할 일:</span> {explanation.avoidNow}
                  </p>
                  {renderRawBasis(item)}
                </div>
              </details>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
