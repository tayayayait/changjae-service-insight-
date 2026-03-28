# 2026 신년 운세 추천 타일 라우팅

## 목적
- `2026 신년 운세 추천 서비스`를 `7개 타일`로 확장하고 `인생 총운 (정통)`과 완전히 분리한다.
- 7개 타일은 모두 서로 다른 `/service/...` 진입점으로 이동하고, lifetime 계열 서비스 ID로 흐르지 않도록 고정한다.
- `올해 운세 (2026년)`은 신규 노출 라인업에서 제외하고 레거시 조회만 유지한다.

## Canonical Mapping (2026 고정)
- `종합 사주 분석` -> `/service/saju-2026-overview`
- `시험/학업운 (2026년)` -> `/service/saju-2026-study-exam`
- `연애/결혼운` -> `/service/saju-love-focus`
- `사업자 재물/사업운 (2026년)` -> `/service/saju-2026-wealth-business`
- `주식/부동산 투자운 (2026년)` -> `/service/saju-2026-investment-assets`
- `직업/적성 (2026년)` -> `/service/saju-2026-career-aptitude`
- `건강운 (2026년)` -> `/service/saju-2026-health-balance`

## 분리 원칙
- 2026 타일은 lifetime 서비스 ID(`saju-lifetime-roadmap`, `saju-career-timing`, `saju-wealth-flow`, `saju-energy-balance`, `saju-yearly-action-calendar`)를 재사용하지 않는다.
- `/category/saju?tab=lifetime`는 사이드바 `인생 총운 (정통)` 전용 진입으로 유지한다.
- `FortuneSpecialGrid`는 경로를 하드코딩하지 않고 `src/lib/serviceCatalog.ts`의 canonical 정의를 단일 소스로 사용한다.

## 서비스 런치 핸드오프
- `analysisServiceId`는 각 타일의 2026 전용 서비스 ID를 그대로 사용한다.
- `nextPath`는 `/saju?mode=new-year-2026&focus=...` 형태로 고정한다.
- 2026 전용 분석 요청은 `saju-yearly-api`로 전달한다. (`인생 총운` 전용 `saju-lifetime-api`와 분리)
- `saju-2026-wealth-business`는 진입 전부터 사업자 전용 서비스임이 드러나도록 카드명과 랜딩 화면에서 `사업자`/`사업자 전용` 문구를 명시한다.
- `연애/결혼운`(`saju-love-focus`)은 solo preset 정책으로 동작한다.
  - `/love/couple-report`로 이동하지 않는다.
  - `/saju` 진입 시 `initialInterests=["love"]`를 전달한다.
- `주식/부동산 투자운`(`saju-2026-investment-assets`)은 `initialInterests=["money","realestate"]`를 전달한다.

## 레거시 호환
- `saju-2026-yearly-outlook`는 레거시 결과 조회와 기존 링크 진입을 유지한다.
- 단, `FortuneSpecialGrid` 및 2026 신규 추천 동선에서는 노출하지 않는다.

## 검증 체크리스트
- `/category/saju?tab=new-year`에서 7개 링크가 모두 `/service/...`로 노출되는지 확인한다.
- 7개 링크가 서로 고유한지 확인한다.
- 7개 링크 중 `/category/saju?tab=lifetime`가 없는지 확인한다.
- `saju-love-focus` 시작 시 `initialInterests=["love"]`가 전달되는지 확인한다.
- `saju-2026-investment-assets` 시작 시 `initialInterests=["money","realestate"]`가 전달되는지 확인한다.
