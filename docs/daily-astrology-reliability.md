# Daily Astrology Reliability Notes (2026-03-19)

## Scope
- 화면: `/astrology/daily`
- 목적: 무한 로딩 방지 + 저품질 결과(영어 단문) 보정 + 재시도 가능성 확보

## Backend (Edge Function `astrology-api`)
- `today` 프록시 실패 시 영어 1문장 고정 폴백을 제거했다.
- 별자리별 한국어 폴백 리포트를 반환한다.
  - 구성: `오늘의 흐름`, `오늘 한 줄 결론`, `지금 할 일 1개`, `오늘 피할 일 1개`, `집중 시간대`, `관계 한 문장`, `컨디션 한 문장`, `럭키 포인트`
  - 응답 타입은 기존 계약(`{ success, data: { sign, horoscope } }`)을 유지한다.
- `today` 요청에는 전용 프록시 타임아웃(8초)을 적용한다.
- `today` 응답에는 선택적 메타를 포함한다.
  - `meta.source`: `proxy | fallback`
  - `meta.reason`: `upstream_timeout | proxy_error` (`fallback`일 때)

## Frontend (`src/lib/astrologyClient.ts`)
- `getSunSignHoroscope()`를 10초 타임아웃 기준 최대 2회 자동 시도로 변경했다.
  - 1차 실패가 지연/네트워크 계열이면 300ms 후 2차 자동 재시도
- `data.horoscope` 스키마를 강제 검증한다.
- 아래 조건에 해당하면 한국어 기본 리포트로 자동 보정한다.
  - 기존 영어 고정 문구와 동일한 경우
  - 비정상적으로 짧은 ASCII 단문 응답인 경우
- 2차까지 실패하면 로컬 규칙형 fallback을 성공 응답으로 반환한다.
  - `meta.source`: `client_fallback`
  - `meta.reason`: `client_timeout | network_error | response_invalid | response_empty | unknown`

## UI (`src/pages/DailyAstrologyPage.tsx`)
- 상태머신: `idle -> loading -> success | error`
- 단계형 로딩 UI 제공
- fallback 성공 시 오류 카드 대신 결과 카드와 보정 안내 문구를 우선 노출
- 완전 실패(재시도+fallback 실패) 시에만 오류 카드 + 재시도 버튼 + 대체 안내 문구 노출
- 중복 클릭 경합은 request id 가드로 차단
- 파싱 성공 시 액션 중심 요약 카드(`오늘 한 줄 결론`, `오늘 바로 실행`, `오늘 바로 활용 정보`)를 우선 렌더링

## Validation
- 테스트:
  - `src/test/astrologyClient.today.test.ts`
    - 1차 타임아웃 후 2차 자동 재시도 성공
    - 2차까지 타임아웃 시 로컬 fallback 성공 반환
    - 빈 응답 시 로컬 fallback 성공 반환
    - 서버/클라이언트 fallback 메타 처리
    - 저품질 영어 단문 자동 보정 + 액션형 포맷 보정 확인
  - `src/test/daily.astrology.page.test.tsx`
    - 액션형 결과 렌더링
    - fallback 성공 시 오류 카드 대신 보정 안내 + 결과 렌더링
    - 실패 후 재시도 성공
