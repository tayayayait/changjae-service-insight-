import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 py-10 px-6 sm:px-8 md:px-12 z-20 relative mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">타야잇시스템즈(TAYA IT SYSTEMS)</h3>
            <div className="text-sm text-stone-500 dark:text-stone-400 space-y-1.5 leading-relaxed">
              <p>대표자: 유창재 | 사업자등록번호: 679-55-00806</p>
              <p>통신판매업신고: 제 2026-경북구미-0317 호</p>
              <p>주소: 경상북도 구미시 해마루공원로 80, 108동 1001호 (옥계동, 중흥에스-클래스에듀힐스)</p>
              <p>고객센터: 010-9487-4173 | dbcdkwo629@naver.com</p>
              <p>개인정보보호책임자: 유창재</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider">법적 고지</h4>
              <ul className="space-y-2 text-sm text-stone-500 dark:text-stone-400">
                <li>
                  <Link to="/terms" className="hover:text-indigo-600 transition-colors">이용약관</Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-indigo-600 transition-colors">개인정보처리방침</Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <Link to="/category/saju?tab=lifetime" className="block text-sm font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider hover:text-indigo-600 transition-colors">서비스</Link>
              <ul className="space-y-2 text-sm text-stone-500 dark:text-stone-400">
                <li>
                  <Link to="/category/saju?tab=lifetime" className="hover:text-indigo-600 transition-colors">사주 분석</Link>
                </li>
                <li>
                  <Link to="/fortune" className="hover:text-indigo-600 transition-colors">오늘의 운세</Link>
                </li>
                <li>
                  <Link to="/mypage" className="hover:text-indigo-600 transition-colors">리포트 찾기</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-stone-400">
            © 2026 TAYA IT SYSTEMS. All rights reserved.
          </p>
          <p className="text-[10px] text-stone-400 max-w-md text-center sm:text-right leading-relaxed">
            본 서비스에서 제공하는 분석 결과는 참고용이며, 중대한 결정 시에는 전문가와 상의하시기 바랍니다. 무단 전재 및 재배포를 금합니다.
          </p>
        </div>
      </div>
    </footer>
  );
};
