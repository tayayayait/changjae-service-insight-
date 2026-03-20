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
      label: "카디널 (시작)", 
      value: data.cardinal, 
      color: "bg-rose-500",
      desc: "주도력, 리더십, 새로운 시작을 알리는 에너지" 
    },
    { 
      id: "fixed", 
      label: "픽스드 (유지)", 
      value: data.fixed, 
      color: "bg-emerald-500",
      desc: "인내심, 끈기, 지속성과 안정감을 주는 에너지" 
    },
    { 
      id: "mutable", 
      label: "뮤터블 (변화)", 
      value: data.mutable, 
      color: "bg-violet-500",
      desc: "적응력, 통찰력, 유연하게 대처하는 에너지" 
    },
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-teal-500 rounded-full"></span>
        행동 패턴 (Modalities/Qualities)
      </h3>

      <div className="space-y-6">
        {chartData.map((item) => {
          const percent = Math.round((item.value / total) * 100);
          return (
            <div key={item.id} className="relative">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h4 className="font-bold text-gray-900">{item.label}</h4>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </div>
                <span className="text-lg font-bold text-gray-700">{percent}%</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
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
