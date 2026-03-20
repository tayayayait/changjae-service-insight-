import React from "react";
import { Sidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";

/**
 * 헬로우봇 스타일의 좌측 사이드바 + 메인 콘텐츠 2Column 레이아웃
 * 데스크탑: 좌측 280px 고정, 우측 스크롤 영역
 * 모바일: 사이드바 기본 숨김 (Drawer 형태 지원 예정)
 */
export const SidebarLayout = () => {
  return (
    <div className="flex h-screen w-full bg-[#F3F4F6] overflow-hidden">
      {/* L1 Navigation: 좌측 사이드바 영역 */}
      <div className="hidden md:block w-[280px] h-full flex-shrink-0 border-r border-gray-200 bg-white">
        <Sidebar />
      </div>

      {/* 우측 메인 콘텐츠 영역 (라우터 Outlet) */}
      <main className="flex-1 h-full overflow-y-auto relative">
        <Outlet />
      </main>
    </div>
  );
};
