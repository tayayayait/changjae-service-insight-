import { cn } from "@/lib/utils";

interface ChanceMeterProps {
  value: number;
  label?: string;
}

const getTone = (value: number) => {
  if (value >= 70) {
    return { text: "가능성 있음", color: "bg-emerald-500" };
  }
  if (value >= 45) {
    return { text: "제한적", color: "bg-amber-500" };
  }
  return { text: "확실한 정보 없음", color: "bg-rose-500" };
};

export function ChanceMeter({ value, label = "재접촉 현실성" }: ChanceMeterProps) {
  const tone = getTone(value);
  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-end justify-between">
        <h3 className="text-[16px] font-bold text-foreground">{label}</h3>
        <span className="text-[22px] font-black text-foreground">{value}%</span>
      </div>
      <div className="mt-3 h-3 rounded-full bg-gray-100">
        <div className={cn("h-full rounded-full", tone.color)} style={{ width: `${value}%` }} />
      </div>
      <p className="mt-2 text-[13px] font-semibold text-text-secondary">{tone.text}</p>
    </section>
  );
}
