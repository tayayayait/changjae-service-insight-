# AdSense Readiness Fix (2026-04-26)

## 확인 결과

- `https://www.saju-insight.co.kr/ads.txt` 는 `google.com, pub-2295415730305709, DIRECT, f08c47fec0942fa0` 로 정상 응답한다.
- 운영 HTML의 `<head>` 에 AdSense 스크립트가 배포되어 있고, 브라우저 네트워크에서도 `adsbygoogle.js` 가 `200` 으로 로드된다.
- AdSense 콘솔의 `Ads.txt 상태` 는 승인됨이므로 현재 장애의 핵심 원인은 `ads.txt` 가 아니다.

## 발견한 승인 리스크

- `AdGate` 가 고정 오버레이에서 AdSense 광고를 보여주고, 카운트다운이 끝난 뒤 결과를 확인하게 했다.
- 해당 구현은 비보상형 AdSense 광고를 콘텐츠 접근 전에 일정 시간 노출하는 형태이며, Google AdSense 광고 배치 정책의 승인 리스크가 크다.
- 오버레이 문구도 사용자가 광고를 보도록 유도하는 표현을 포함했다.

## 조치

- `src/components/common/AdGate.tsx` 를 콘텐츠 즉시 렌더링 래퍼로 변경했다.
- 기존 호출부 API는 유지해 라우트/페이지 동작 변경 범위를 최소화했다.
- `index.html` 에 `google-adsense-account` 메타 태그를 추가해 사이트 소유권 확인 신호를 보강했다.

## 운영 후속 조치

- 배포 후 AdSense `사이트` 페이지에서 `검토 요청`을 다시 실행한다.
- AdSense 승인이 완료되기 전에는 광고가 계속 미노출될 수 있다. Google 공식 문서 기준 사이트 검토는 보통 며칠, 경우에 따라 2-4주가 걸릴 수 있다.
- 승인 전까지는 고정 오버레이, 카운트다운, 광고 시청 유도 문구를 다시 추가하지 않는다.
