# 프로젝트 전체 UI 껍데기 교체 실행 계획 (활성 라우트 한정)

## 1. 목표와 불변 계약
- 목표: 활성 라우트 UI를 `light observatory + premium wellness editorial` 스타일로 전면 교체.
- 불변 계약:
  - 라우트 path/query/param 유지
  - `serviceId -> nextPath` 동선 유지
  - API action/payload key 및 store shape 유지
  - 비즈니스 로직은 훅으로 분리 후 재결합, 외부 계약 변경 금지

## 2. 범위
- 대상: App 기준 활성 라우트(`category/service/saju/result/astrology/love/fortune/chat/mypage/my-reports/help/privacy/terms/notfound`).
- 제외: 미연결 레거시 페이지.

## 3. 실행 항목
1. 문서/디자인 기준 재정의
- `DESIGN.md`, `docs/ui-ux-spec.md` 동기화
- 테마 토큰 통일:
  - 배경 `#FAF7F2`
  - 카드 `#FFFFFF`
  - 본문 `#24303F`
  - CTA `#C9A86A`
  - 보조 `#BFD0C7`
  - 서브 배경 `#EAF1F7`
2. Hook 방공호 구축
- 기존/신규 도메인 훅으로 비즈니스 로직 이동:
  - `src/hooks/saju/*`
  - `src/hooks/astrology/*`
  - `src/hooks/love/*`
  - `src/hooks/fortune/*`
  - `src/hooks/chat/*`
  - `src/hooks/account/*`
3. Stitch 산출물 기반 조립
- 프레젠테이션 레이어만 반영
- 페이지는 `hook 바인딩 + 화면 조립` 역할만 유지
4. 공통 레이아웃 일괄 교체
- `SidebarLayout`, `FunnelLayout`, `AnalysisPageShell`, `AppLayout`, `GNB`, `BottomTab`
5. 계약 회귀 수복
- palm/face 레거시 alias 라우팅 복원
- `ServiceLandingPage` palm canonical redirect 복원
- 결과 fingerprint 정규화(관심사 정렬, 질문 trim/공백 정규화)

## 4. 검증 기준
- 기본 명령: `npm test -- --reporter=dot`
- 합격 조건:
  - baseline 대비 추가 실패 0건
  - 신규 회귀 없음

## 5. 최종 검증 결과 (2026-03-24)
- 실행 명령: `npm test -- --reporter=dot`
- 결과: `36 passed` test files, `118 passed` tests, `0 failed`
- 판단: baseline 대비 추가 실패 0건, 회귀 없음
