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
    { name: "불 (Fire)", value: data.fire, color: "#ef4444", icon: Flame, bg: "bg-red-50 text-red-600" },
    { name: "흙 (Earth)", value: data.earth, color: "#eab308", icon: Mountain, bg: "bg-yellow-50 text-yellow-600" },
    { name: "공기 (Air)", value: data.air, color: "#06b6d4", icon: Wind, bg: "bg-cyan-50 text-cyan-600" },
    { name: "물 (Water)", value: data.water, color: "#3b82f6", icon: Droplets, bg: "bg-blue-50 text-blue-600" },
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
        원소 밸런스 (Elements)
      </h3>
      
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="w-48 h-48 relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}개 행성`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-gray-900">{total}</span>
            <span className="text-xs text-gray-500">Planets</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          {chartData.map((item) => {
            const Icon = item.icon;
            const percent = Math.round((item.value / total) * 100);
            return (
              <div key={item.name} className={`p-4 rounded-2xl ${item.bg} border transition-all hover:-translate-y-1`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5" />
                  <span className="font-bold">{item.name}</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black">{percent}%</span>
                  <span className="text-sm font-medium mb-1 opacity-80">{item.value}개</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
