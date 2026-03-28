# UI/UX Specification (Light Observatory + Premium Wellness Editorial)

## 1. 목적
- 활성 라우트 UI를 일관된 라이트 에디토리얼 스타일로 전면 교체한다.
- 기존 기능, 비즈니스 로직, API 계약, 라우팅 계약은 유지한다.

## 2. 디자인 시스템 규칙
- 핵심 팔레트:
  - Background: `#FAF7F2`
  - Card: `#FFFFFF`
  - Text: `#24303F`
  - Primary CTA: `#C9A86A`
  - Secondary Accent: `#BFD0C7`
  - Subtle Surface: `#EAF1F7`
- 금지 규칙:
  - 과한 보라 그라데이션
  - 진한 우주 배경
  - 강한 글로우 효과

## 3. 레이아웃 규칙
- 모바일 퍼스트:
  - 진입/탐색/입력 퍼널은 단일 컬럼, 빠른 전환 중심
- 데스크톱 확장:
  - 결과/리포트 화면은 넓은 읽기 폭, 섹션 분할, 카드 가독성 강화
- 공통 셸:
  - `SidebarLayout`, `FunnelLayout`, `AnalysisPageShell`, `AppLayout`, `GNB`, `BottomTab`를 통일된 스타일로 사용

## 4. 구현 아키텍처 규칙
- 페이지는 프레젠테이션 조립에 집중하고 로직은 훅으로 분리한다.
- 도메인 훅 경로:
  - `src/hooks/saju/*`
  - `src/hooks/astrology/*`
  - `src/hooks/love/*`
  - `src/hooks/fortune/*`
  - `src/hooks/chat/*`
  - `src/hooks/account/*`
- 정적 콘텐츠는 데이터 레이어로 분리해 화면 컴포넌트와 분리한다.

## 5. 계약 불변 규칙
- 라우트 path/query/param 유지
- `serviceId -> nextPath` 동선 유지
- API action/payload key 유지
- store shape 유지

## 6. 회귀 대응 규칙
- 레거시 alias/canonical redirect는 기능 계약으로 간주하고 유지한다.
- 숨김 서비스(`hideFromGrid`)는 그리드 노출과 landing 접근을 분리해서 관리한다.
- fingerprint 계산은 입력 순서/공백 차이로 결과가 달라지지 않도록 정규화한다.

## 7. 검증
- 명령: `npm test -- --reporter=dot`
- 최신 결과 (2026-03-24):
  - `36 passed` test files
  - `118 passed` tests
  - `0 failed`

## 8. /saju 상단 헤더 정책 (2026-03-24)
- `/saju`에서는 GNB 1차 탐색과 유틸리티 액션을 숨긴다.
- 비노출 항목:
  - `홈`
  - `내 사주`
  - `운세`
  - `궁합`
  - `보관함`
  - `도움말`
  - `최근 결과`
- 목적: 사주 입력 퍼널에서 이탈 동선을 줄이고 입력 집중도를 높인다.

## 9. Reading Header Stability (2026-03-28)
- `AnalysisPageShell` reading mode compact header no longer toggles on scroll direction.
- Compact header appears after crossing `scrollTop > 80` and remains visible while reading.
- Compact header hides only near the top (`scrollTop <= 20`) to prevent flicker.
