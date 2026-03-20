import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, 
  MoonStar, 
  Hand, 
  Heart, 
  Coins, 
  Briefcase,
  Users,
  LogOut,
  User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

const HOME_PATH = "/category/saju";

/**
 * 헬로우봇 스타일 라우팅 카테고리 정의
 */
const CATEGORIES = [
  {
    title: "사주·만세력",
    icon: <MoonStar className="w-5 h-5" />,
    id: "saju",
    items: [
      { name: "인생 총운 (정통)", path: "/category/saju?tab=lifetime" },
      { name: "2026 신년 운세", path: "/category/saju?tab=new-year" },
      { name: "오늘의 운세", path: "/category/saju?tab=today" },
    ]
  },
  {
    title: "점성학·별자리",
    icon: <Sparkles className="w-5 h-5 text-yellow-500" />,
    id: "astrology",
    items: [
      { name: "네이탈 차트 (성격)", path: "/astrology" },
      { name: "코스믹 이벤트", path: "/astrology/calendar" },
      { name: "오늘의 별자리", path: "/astrology/daily" },
    ]
  },
  {
    title: "관상·손금",
    icon: <Hand className="w-5 h-5" />,
    id: "palmistry",
    items: [
      { name: "AI 손금 스캐너", path: "/category/palmistry?tab=palm" },
    ]
  },
  {
    title: "연애·궁합",
    icon: <Heart className="w-5 h-5 text-pink-500" />,
    id: "love",
    items: [
      { name: "미래 배우자", path: "/love/future-partner" },
      { name: "커플 궁합", path: "/love/couple-report" },
      { name: "짝사랑·재회", path: "/love/crush-reunion" },
    ]
  }
];

export const Sidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  // 현재 열려있어야 하는 아코디언 찾기 (현재 경로 기반)
  const defaultOpenIds = CATEGORIES.filter(cat => 
    cat.items.some(item => location.pathname === item.path || location.pathname.startsWith(`/category/${cat.id}`))
  ).map(cat => cat.id);

  const handleAuthClick = () => {
    if (user) {
      navigate("/mypage");
    } else {
      navigate("/login");
    }
  };

  const handleSignOut = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await signOut();
    toast.success("로그아웃되었습니다.");
    navigate(HOME_PATH);
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-sm pt-4">
      <div className="px-6 mb-6">
        {/* 서비스 로고 영역 */}
        <Link to={HOME_PATH} className="flex items-center gap-2 font-bold text-xl text-gray-900 tracking-tight">
          <span className="bg-primary/10 text-primary px-2 py-1 rounded-lg">창재</span>
          운세 플랫폼
        </Link>
      </div>

      <ScrollArea className="flex-1 px-4">
        <Accordion 
          type="multiple" 
          defaultValue={defaultOpenIds.length > 0 ? defaultOpenIds : [CATEGORIES[0].id]} 
          className="w-full space-y-2"
        >
          {CATEGORIES.map((category) => (
            <AccordionItem value={category.id} key={category.id} className="border-none">
              <AccordionTrigger className="hover:bg-gray-50 px-3 py-3 rounded-xl transition-all data-[state=open]:bg-gray-50/50 hover:no-underline">
                <div className="flex items-center gap-3 text-gray-700 font-medium">
                  {category.icon}
                  <span className="text-[15px]">{category.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-2">
                <div className="flex flex-col space-y-1 ml-9 border-l-2 border-gray-100 pl-4">
                  {category.items.map((item) => {
                    // 현재 선택된 서브메뉴 표시 로직
                    const isActive = location.pathname + location.search === item.path || 
                                    (location.pathname === item.path.split('?')[0] && !location.search && !item.path.includes('?'));
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={cn(
                          "py-2 text-[14px] transition-colors rounded-md px-2",
                          isActive 
                            ? "text-primary font-semibold bg-primary/5" 
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        )}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
      
      {/* 헬로우봇처럼 하단에 로그인/유틸리티 영역 확보 */}
      <div className="p-4 border-t border-gray-100 mt-auto space-y-2">
         <Link 
           to="/mypage" 
           className={cn(
             "flex items-center gap-3 w-full p-3 rounded-xl text-[14px] font-medium transition-all group",
             location.pathname === "/mypage" 
               ? "bg-primary text-white shadow-lg shadow-primary/20" 
               : "bg-gray-50 text-gray-700 hover:bg-primary/5 hover:text-primary"
           )}
         >
           <div className={cn(
             "p-1.5 rounded-lg shadow-sm transition-all",
             location.pathname === "/mypage" ? "bg-white/20 shadow-none" : "bg-white group-hover:shadow-md"
           )}>
             <UserIcon className={cn("w-4 h-4", location.pathname === "/mypage" ? "text-white" : "text-primary")} />
           </div>
           보관함
         </Link>

         {user ? (
           <div className="flex items-center gap-2">
             <div 
               onClick={handleAuthClick}
               className="flex-1 flex items-center gap-3 p-3 border border-gray-100 rounded-xl text-[14px] font-semibold text-gray-900 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm active:scale-[0.98]"
             >
               <UserIcon className="w-4 h-4 text-gray-500" />
               <span className="truncate">{user.email?.split('@')[0]}님</span>
             </div>
             <button 
               onClick={handleSignOut}
               className="p-3 border border-gray-100 rounded-xl hover:bg-red-50 hover:border-red-100 group transition-colors shadow-sm"
               title="로그아웃"
             >
               <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
             </button>
           </div>
         ) : (
           <div 
             onClick={handleAuthClick}
             className="w-full p-3 border border-gray-100 rounded-xl text-center text-[14px] font-semibold text-gray-900 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm active:scale-[0.98]"
           >
              로그인 / 회원가입
           </div>
         )}
      </div>
    </div>
  );
};
