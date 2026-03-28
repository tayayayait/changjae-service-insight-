import React from "react";
import { History, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export const RecentArchiveWidget: React.FC = () => {
  const recents = [
    { id: "1", title: "2026 인생 황금기", category: "사주", date: "어제" },
    { id: "2", title: "내 안의 페르소나", category: "점성학", date: "3일 전" },
  ];

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <History className="w-4 h-4 text-blue-600" />
          </div>
          <h4 className="text-[15px] font-bold text-gray-900">리포트 다시보기</h4>
        </div>
        <Link to="/mypage" className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5">
          모두 보기 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {recents.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ x: 3 }}
            className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 hover:bg-white hover:border-gray-200 border border-transparent transition-all cursor-pointer group"
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-blue-400 mb-0.5 uppercase tracking-wider">{item.category}</span>
              <span className="text-[13px] font-bold text-gray-800 group-hover:text-primary transition-colors">{item.title}</span>
            </div>
            <span className="text-[11px] text-gray-400 font-medium">{item.date}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
