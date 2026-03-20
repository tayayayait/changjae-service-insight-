import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, Star } from "lucide-react";
import { RecentArchiveWidget } from "./RecentArchiveWidget";

export const CategorySidebar: React.FC = () => {
  return (
    <div className="hidden lg:flex flex-col gap-6 w-[280px] shrink-0 sticky top-24 h-fit">
      <Card className="p-5 rounded-[24px] border border-gray-100 shadow-sm bg-white/50 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h4 className="text-[15px] font-bold text-gray-900">실시간 인기 분석</h4>
        </div>
        <div className="space-y-3">
          {[
            { id: 1, title: "2026 내 운세 체크", count: "1.2k" },
            { id: 2, title: "배우자 운명 GPS", count: "850" },
            { id: 3, title: "내 사주 귀인 도감", count: "420" },
          ].map((item, idx) => (
            <div key={item.id} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-primary/60 w-4">{idx + 1}</span>
                <span className="text-[13px] text-gray-700 group-hover:text-primary transition-colors line-clamp-1">
                  {item.title}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">{item.count}</span>
            </div>
          ))}
        </div>
      </Card>

      <RecentArchiveWidget />

      <Card className="relative overflow-hidden p-5 rounded-[24px] border-none shadow-sm bg-slate-900 text-white group cursor-pointer">
        <div className="absolute top-0 right-0 w-16 h-16 bg-primary opacity-20 blur-2xl group-hover:opacity-40 transition-opacity" />
        <div className="relative z-10">
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Membership</span>
          </div>
          <h4 className="text-[15px] font-bold mb-1 leading-tight">
            프리미엄 리포트
            <br />
            무제한 패스 출시!
          </h4>
          <p className="text-[11px] text-white/50 mb-3">
            350가지 이상의 모든 정밀 분석 서비스를 제한 없이 이용해 보세요.
          </p>
          <button className="w-full py-2 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">
            자세히 보기
          </button>
        </div>
      </Card>
    </div>
  );
};
