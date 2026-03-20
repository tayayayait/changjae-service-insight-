# 프로필 자동 인식 및 시주(時柱) 선택 업데이트

## 변경 목적
- 태어난 시간 입력을 `자시~해시` 기준으로 통일한다.
- 회원가입 후 설정한 `user_profiles` 정보를 각 서비스에서 자동 인식해, 매번 사주 정보를 다시 입력하지 않도록 한다.

## 1) 시주 선택 방식 통일
- 공통 시간대 정의를 `src/lib/timeBlocks.ts`로 통합했다.
- 기존 `새벽/아침/...` 구간 대신 아래 12지지 시주를 사용한다.
  - 자시, 축시, 인시, 묘시, 진시, 사시, 오시, 미시, 신시, 유시, 술시, 해시
- 저장값 호환을 위해 기존 id(`dawn`, `morning` 등)와 과거 라벨도 새 id로 정규화한다.

## 2) 회원 프로필 자동 인식
- `src/lib/resultStore.ts`에 `getLatestSajuResultOrProfile()`를 추가했다.
  - 우선순위 1: 최근 저장된 사주 결과
  - 우선순위 2: 로그인 사용자 `user_profiles`를 기반으로 런타임 사주 데이터 자동 계산
- `/saju` 진입 시에도 동일 원칙을 적용한다.
  - 프로필이 완성된 회원: 입력 8단계를 건너뛰고 자동 분석 실행
  - 프로필이 없는 사용자: 기존 입력 퍼널 진행
- 이 함수를 다음 화면에서 사용하도록 변경했다.
  - `src/store/useResultStore.ts`
  - `src/pages/fortune/YearlyFortunePage.tsx`
  - `src/pages/CompatibilityPage.tsx`
- 결과적으로 저장된 사주 결과가 없어도, 회원 프로필만 있으면 주요 서비스가 바로 동작한다.

## 3) UI 반영 범위
- `src/pages/MyPage.tsx`
- `src/pages/ProfileSetup.tsx`
- `src/pages/SajuInput.tsx`
- `src/components/love/LoveInputStepper.tsx`

모든 화면에서 시간대 선택값은 동일한 시주 기준(id)로 저장/전달된다.

## 4) 무한 로딩 방지
- 프로필 저장 흐름(`MyPage`, `ProfileSetup`)에 네트워크 타임아웃 가드를 추가했다.
  - 인증 조회: 10초
  - 프로필 upsert: 15초
  - 저장 후 프로필 동기화: 10초
- 타임아웃 시 로딩 상태를 해제하고 오류 토스트를 노출한다.

## 5) 지역 선택 표준화 (MyPage)
- `src/pages/MyPage.tsx`의 내 정보 수정에서 지역 입력을 자유 텍스트 대신 `시/도` 단일 선택 UI로 변경했다.
- 저장 포맷은 `시/도` 문자열(예: `서울특별시`)로 통일한다.
- 기존 레거시 값(`서울`, `경기/인천` 등)은 화면 진입 시 표준 선택값으로 자동 매핑한다.
