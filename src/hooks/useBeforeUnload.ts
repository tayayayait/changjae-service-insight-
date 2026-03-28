import { useEffect } from "react";

/**
 * 사용자가 입력/작성 중일 때 페이지 이탈 시 경고를 표시합니다.
 * @param isDirty true이면 beforeunload 경고를 활성화합니다.
 */
export function useBeforeUnload(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // 최신 브라우저는 returnValue 설정이 필요합니다.
      // 표시되는 메시지는 브라우저가 결정합니다.
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);
}
