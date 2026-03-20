import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

/**
 * 사이드바 없이 단독으로 렌더링되며, 상단에 < 뒤로가기 헤더만 제공되는 몰입형 레이아웃
 * 폼 입력 퍼널, 상세 결과 페이지 등에 사용됨
 */
export const FunnelLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#F3F4F6]">
      {/*  뒤로가기 헤더 - 각 페이지에서 전용 뒤로가기 버튼을 제공하므로 숨김 처리 */}
      <header className="sticky top-0 z-10 hidden h-14 items-center px-4 bg-white border-b border-gray-200">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center justify-center p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </header>
      
      {/* 메인 뷰 (입력 폼 또는 리포트) */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 md:py-8 relative">
        <Outlet />
      </main>
    </div>
  );
};
