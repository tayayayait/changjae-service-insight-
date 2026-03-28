import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Flame, Mountain, Wind, Droplets } from "lucide-react";

interface ElementChartProps {
  data: {
    fire: number;
    earth: number;
    air: number;
    water: number;
  };
}

export function ElementChart({ data }: ElementChartProps) {
  const chartData = [
    { name: "불 (Fire)", desc: "열정적인 실행력", value: data.fire, color: "#ef4444", icon: Flame, bg: "bg-red-50/70 text-red-600 border-red-100" },
    { name: "흙 (Earth)", desc: "현실적인 판단력", value: data.earth, color: "#eab308", icon: Mountain, bg: "bg-yellow-50/70 text-yellow-600 border-yellow-100" },
    { name: "공기 (Air)", desc: "논리적인 사고력", value: data.air, color: "#06b6d4", icon: Wind, bg: "bg-cyan-50/70 text-cyan-600 border-cyan-100" },
    { name: "물 (Water)", desc: "감정 중심 성향", value: data.water, color: "#3b82f6", icon: Droplets, bg: "bg-blue-50/70 text-blue-600 border-blue-100" },
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-black text-slate-900">
        <span className="h-6 w-1.5 rounded-full bg-indigo-500"></span>
        원소 성향 (Elements)
      </h3>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 sm:flex-row">
        <div className="relative h-28 w-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={54}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | string, _name, entry) => {
                  const payload =
                    entry && typeof entry === "object" && "payload" in entry
                      ? (entry as { payload?: { desc?: string } }).payload
                      : undefined;
                  return [`${Math.round((Number(value) / total) * 100)}%`, payload?.desc ?? ""];
                }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:gap-2.5">
          {chartData.map((item) => {
            const Icon = item.icon;
            const percent = Math.round((item.value / total) * 100);
            return (
              <div key={item.name} className={`rounded-xl border p-2.5 sm:p-3 transition-all hover:-translate-y-0.5 ${item.bg}`}>
                <div className="mb-1.5 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-[13px] font-black tracking-tight">{item.name.split(' (')[0]}</span>
                  </div>
                  <span className="text-sm font-black md:text-base">{percent}%</span>
                </div>
                <p className="break-keep text-[11px] font-semibold leading-tight tracking-tight opacity-80 sm:text-xs text-balance">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
