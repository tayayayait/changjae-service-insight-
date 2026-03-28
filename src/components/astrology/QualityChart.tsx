interface QualityChartProps {
  data: {
    cardinal: number;
    fixed: number;
    mutable: number;
  };
}

export function QualityChart({ data }: QualityChartProps) {
  const chartData = [
    {
      id: "cardinal",
      label: "카디널",
      value: data.cardinal,
      color: "bg-rose-500",
      bgClass: "bg-rose-50/70 border-rose-100",
      textClass: "text-rose-900",
      desc: "주도력, 리더십, 새로운 시작"
    },
    {
      id: "fixed",
      label: "픽스드",
      value: data.fixed,
      color: "bg-emerald-500",
      bgClass: "bg-emerald-50/70 border-emerald-100",
      textClass: "text-emerald-900",
      desc: "인내심, 끈기, 지속성과 안정"
    },
    {
      id: "mutable",
      label: "뮤터블",
      value: data.mutable,
      color: "bg-violet-500",
      bgClass: "bg-violet-50/70 border-violet-100",
      textClass: "text-violet-900",
      desc: "적응력, 통찰력, 유연한 대처"
    },
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-black text-slate-900">
        <span className="h-6 w-1.5 rounded-full bg-teal-500"></span>
        행동 패턴 (Modalities)
      </h3>

      <div className="flex flex-1 flex-col justify-center gap-4">
        {chartData.map((item) => {
          const percent = Math.round((item.value / total) * 100);
          return (
            <div key={item.id} className={`rounded-2xl border p-3.5 md:p-4 transition-all hover:-translate-y-0.5 ${item.bgClass}`}>
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h4 className={`text-sm font-black tracking-tight ${item.textClass}`}>{item.label}</h4>
                  <p className={`mt-1 text-xs font-semibold tracking-tight opacity-80 ${item.textClass}`}>{item.desc}</p>
                </div>
                <span className={`text-xl font-black ${item.textClass} shrink-0`}>{percent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/60">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
