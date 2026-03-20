import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
}

interface CategoryTabsProps {
  tabs: Tab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

/**
 * 헬로우봇 스타일의 가로 스크롤 탭 바 컴포넌트
 * 활성 탭 클릭 시 해당 탭이 중앙 또는 가시 영역으로 자동 스크롤되는 기능을 포함합니다.
 */
export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  className,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // 활성 탭이 바뀔 때마다 해당 탭이 화면 중앙으로 오도록 스크롤
  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      const scrollContainer = scrollRef.current;
      const tabElement = activeTabRef.current;
      
      const scrollLeft = tabElement.offsetLeft - (scrollContainer.offsetWidth / 2) + (tabElement.offsetWidth / 2);
      
      scrollContainer.scrollTo({
        left: scrollLeft,
        behavior: "smooth"
      });
    }
  }, [activeTabId]);

  return (
    <div 
      ref={scrollRef}
      className={cn(
        "flex overflow-x-auto no-scrollbar border-t border-gray-100 px-4 scroll-smooth",
        className
      )}
    >
      <div className="flex space-x-6 min-w-max">
        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "whitespace-nowrap py-3 text-[15px] font-medium transition-colors relative",
                isActive ? "text-gray-900 font-bold" : "text-gray-500 hover:text-gray-900"
              )}
            >
              {tab.label}
              {isActive && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" 
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
