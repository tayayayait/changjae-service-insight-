# Fortune 서브 네비게이션 정책

## 목적
- `인생 총운 (정통)`과 `2026 신년 운세`의 진입 동선을 혼합하지 않고 명확히 분리한다.
- 서브 네비게이션과 2026 타일 라우팅이 같은 정책을 따르도록 문서 기준을 고정한다.

## 네비게이션 원칙
- `인생 총운 (정통)`은 `/category/saju?tab=lifetime` 전용이다.
- `2026 신년 운세`는 `/category/saju?tab=new-year` 전용이다.
- `/fortune` 계열 화면은 허브/탐색 용도이며, 2026 7타일 진입은 항상 `/service/...` 경유로 시작한다.

## 2026 7타일 라우팅 기준
- canonical 매핑은 `docs/new-year-tile-routing.md`를 단일 기준으로 사용한다.
- 7타일은 lifetime 서비스 ID를 재사용하지 않는다.
- `연애/결혼운`은 `saju-love-focus`로 진입하며 couple-report 플로우를 사용하지 않는다.
- `주식/부동산 투자운`은 `saju-2026-investment-assets`로 진입한다.

## handoff 정책
- `ServiceLandingPage`에서 `analysisServiceId`, `nextPath`, `initialInterests`를 단일 로직으로 전달한다.
- `saju-love-focus`는 `initialInterests=["love"]`를 전달하고 `/saju?mode=new-year-2026&focus=love`로 이동한다.
- `saju-2026-investment-assets`는 `initialInterests=["money","realestate"]`를 전달하고 `/saju?mode=new-year-2026&focus=investment-assets`로 이동한다.
- 2026 전용 서비스의 AI 분석 호출 함수는 `saju-yearly-api`로 고정하며, lifetime 계열은 `saju-lifetime-api`를 유지한다.
- `saju-2026-yearly-outlook`는 레거시 조회/링크 호환만 유지하고 2026 신규 추천 타일에서는 제외한다.

## 운영 체크
- staging에서 먼저 7타일 URL/랜딩을 검증하고 hard refresh로 캐시 영향을 제거한다.
- 동일 커밋을 production에 반영한 뒤 동일 시나리오를 반복 검증한다.
