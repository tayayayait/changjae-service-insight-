# 사주 7종 리포트 계약서 (v2)

## 공통 계약
- 대상 서비스: `saju-lifetime-roadmap`, `saju-daeun-shift`, `saju-career-timing`, `saju-wealth-flow`, `saju-helper-network`, `saju-energy-balance`, `saju-yearly-action-calendar`
- 응답 공통 필드:
  - `summary: string`
  - `sections: { title, interpretation, advice, luckyTip? }[]`
  - `reportTemplateVersion: "saju-report-v2"`
  - `reportPayload.coreInsights: string[]`
  - `reportPayload.actionNow: string[]`
  - `reportPayload.evidence: string[]`
- 저장 공통 필드:
  - `saju_results.report_payload (JSONB)`
  - `saju_results.report_template_version (TEXT)`

## 서비스별 확장 payload
| 서비스 ID | 필수 확장 필드 | 템플릿 시그니처 |
|---|---|---|
| `saju-lifetime-roadmap` | `longTermFlow`, `pivotMoments[]`, `tenYearStrategy[]` | 장기 흐름, 핵심 변곡, 10년 전략 |
| `saju-daeun-shift` | `transitionSignal`, `ninetyDayActions[]`, `avoidanceScenario[]` | 전환 감지, 90일 액션, 회피 시나리오 |
| `saju-career-timing` | `careerWindow`, `decisionTree[]`, `executionChecklist[]` | 커리어 윈도우, 의사결정 트리, 실행 체크리스트 |
| `saju-wealth-flow` | `cashflowMap`, `riskZones[]`, `assetRules[]` | 현금흐름 맵, 리스크 구간, 자산 운영 규칙 |
| `saju-helper-network` | `helperMap`, `conflictPatterns[]`, `networkGuide[]` | 귀인 지도, 갈등 패턴, 관계 운영 가이드 |
| `saju-energy-balance` | `energyCurve`, `routineDesign[]`, `recoveryProtocol[]` | 에너지 곡선, 루틴 설계, 회복 프로토콜 |
| `saju-yearly-action-calendar` | `quarterlyGoals[]`, `monthlyActions[]`, `riskCalendar[]` | 분기 목표, 월별 실행, 리스크 캘린더 |

## 레거시 호환
- `reportPayload`가 없으면 레거시 렌더러를 사용한다.
- `saju-lifetime-roadmap`은 기존 필드(`lifetimeScore`, `daeunPeriods`, `goldenPeriods`, `personalityType`)를 계속 저장/조회한다.
- 기존 데이터 백필은 하지 않는다. 신규 생성분부터 v2 계약을 적용한다.
