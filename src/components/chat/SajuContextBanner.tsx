import React, { useState } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { ChevronDown, ChevronUp, User, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

const hanjaToHangul: Record<string, string> = {
    甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
    己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
    子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
    午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

const tH = (str: string) => hanjaToHangul[str] || str;

export const SajuContextBanner: React.FC = () => {
    const sajuContext = useChatStore((state) => state.sajuContext);
    const [isExpanded, setIsExpanded] = useState(false);

    if (!sajuContext) {
        return null;
    }

    const { palja, profileMeta, oheng } = sajuContext;

    const ohengColors: Record<string, { text: string, bg: string, border: string, bar: string, badgeText: string }> = {
        "목": { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", bar: "bg-emerald-500", badgeText: "text-emerald-500" },
        "화": { text: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20", bar: "bg-rose-500", badgeText: "text-rose-500" },
        "토": { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", bar: "bg-amber-500", badgeText: "text-amber-500" },
        "금": { text: "text-slate-300", bg: "bg-slate-300/10", border: "border-slate-300/20", bar: "bg-slate-400", badgeText: "text-slate-400" },
        "수": { text: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/20", bar: "bg-sky-500", badgeText: "text-sky-500" },
    };

    const renderChar = (char: string, oheng: string) => {
        const color = ohengColors[oheng] || { text: "text-zinc-400", bg: "bg-zinc-800/50", border: "border-zinc-700", bar: "bg-zinc-500", badgeText: "text-zinc-500" };
        return (
            <div className={`flex flex-col items-center justify-center py-[7px] px-1 rounded-lg border ${color.bg} ${color.border} shadow-sm`}>
                <span className={`font-bold text-[17px] leading-none mb-1 ${color.text}`}>{tH(char)}</span>
                <span className={`text-[10px] font-medium leading-none ${color.badgeText} opacity-90`}>{oheng}</span>
            </div>
        );
    };

    return (
        <div className="bg-zinc-900/80 border-b border-zinc-800 shrink-0 sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60 transition-all">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                            <CalendarDays size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-medium text-zinc-100 flex items-center gap-2">
                                나의 사주 요약
                                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                                    {profileMeta.birthYear}년생
                                </span>
                                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                    상담 중
                                </span>
                            </h3>
                            <p className="text-[13px] text-zinc-400 line-clamp-1 mt-1 font-medium tracking-wide">
                                {tH(palja.year.gan)}{tH(palja.year.ji)}년 {tH(palja.month.gan)}{tH(palja.month.ji)}월 {tH(palja.day.gan)}{tH(palja.day.ji)}일 {tH(palja.time.gan)}{tH(palja.time.ji)}시
                            </p>
                        </div>
                    </div>
                    <div className="text-zinc-500 bg-zinc-800/50 p-1.5 rounded-full">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </button>

                {isExpanded && (
                    <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-zinc-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                            <div className="bg-zinc-800/40 rounded-2xl p-5 border border-zinc-700/50 shadow-sm flex flex-col">
                                <h4 className="text-xs font-semibold text-zinc-400 mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                        사주 원국 (본성)
                                    </div>
                                    <span className="text-[10px] font-normal text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">오행 색상 포함</span>
                                </h4>
                                <div className="grid grid-cols-4 gap-2 text-center mt-auto">
                                    <div className="space-y-1.5 flex flex-col justify-end">
                                        <div className="text-[11px] text-zinc-400 bg-zinc-900/50 py-1.5 rounded mb-1 border border-zinc-800/50 flex flex-col justify-center">
                                            <span className="font-semibold text-zinc-300 leading-tight">시주</span>
                                            <span className="text-[9px] text-zinc-500 opacity-80 leading-tight mt-0.5">말년/미래</span>
                                        </div>
                                        {renderChar(palja.time.gan, palja.time.ohengGan)}
                                        {renderChar(palja.time.ji, palja.time.ohengJi)}
                                    </div>
                                    <div className="space-y-1.5 flex flex-col justify-end">
                                        <div className="text-[11px] bg-purple-500/10 py-1.5 rounded mb-1 border border-purple-500/20 shadow-sm flex flex-col justify-center">
                                            <span className="font-semibold text-purple-300 leading-tight">일주</span>
                                            <span className="text-[9px] text-purple-400/80 leading-tight mt-0.5">(나)본인</span>
                                        </div>
                                        {renderChar(palja.day.gan, palja.day.ohengGan)}
                                        {renderChar(palja.day.ji, palja.day.ohengJi)}
                                    </div>
                                    <div className="space-y-1.5 flex flex-col justify-end">
                                        <div className="text-[11px] text-zinc-400 bg-zinc-900/50 py-1.5 rounded mb-1 border border-zinc-800/50 flex flex-col justify-center">
                                            <span className="font-semibold text-zinc-300 leading-tight">월주</span>
                                            <span className="text-[9px] text-zinc-500 opacity-80 leading-tight mt-0.5">청년/환경</span>
                                        </div>
                                        {renderChar(palja.month.gan, palja.month.ohengGan)}
                                        {renderChar(palja.month.ji, palja.month.ohengJi)}
                                    </div>
                                    <div className="space-y-1.5 flex flex-col justify-end">
                                        <div className="text-[11px] text-zinc-400 bg-zinc-900/50 py-1.5 rounded mb-1 border border-zinc-800/50 flex flex-col justify-center">
                                            <span className="font-semibold text-zinc-300 leading-tight">년주</span>
                                            <span className="text-[9px] text-zinc-500 opacity-80 leading-tight mt-0.5">초년/조상</span>
                                        </div>
                                        {renderChar(palja.year.gan, palja.year.ohengGan)}
                                        {renderChar(palja.year.ji, palja.year.ohengJi)}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-zinc-800/40 rounded-2xl p-5 border border-zinc-700/50 shadow-sm flex flex-col">
                                <h4 className="text-xs font-semibold text-zinc-400 mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        오행 분포 (기질)
                                    </div>
                                </h4>
                                <div className="space-y-3.5 mt-auto">
                                    {oheng.map((item) => {
                                        const color = ohengColors[item.element] || { bar: "bg-zinc-500", text: "text-zinc-300", bg: "bg-zinc-900/50" };
                                        return (
                                            <div key={item.element} className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg ${color.bg} border border-zinc-700/30 flex items-center justify-center shrink-0`}>
                                                    <span className={`text-sm font-semibold ${color.text}`}>{item.element}</span>
                                                </div>
                                                <div className="flex-1 h-2.5 bg-zinc-900/80 border border-zinc-800/50 rounded-full overflow-hidden shadow-inner flex items-center">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${color.bar}`}
                                                        style={{ width: `${item.percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-zinc-400 w-10 text-right font-medium">{item.count}개</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
