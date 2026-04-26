# SEO Domain Canonical Fix (2026-04-08)

## 사실

- 운영 응답 기준 `http://saju-insight.co.kr/` 는 `https://saju-insight.co.kr/` 로 `308` 리디렉션된다.
- 외부 확인 기준 `https://saju-insight.co.kr/` 는 `https://www.saju-insight.co.kr/` 로 다시 이동한다.
- 따라서 현재 최종 대표 URL은 `https://www.saju-insight.co.kr/` 이다.

## 문제

- 저장소의 canonical URL이 `https://saju-insight.co.kr/` 로 남아 있었다.
- `public/sitemap.xml` 과 `public/robots.txt` 도 non-www 기준으로 남아 있었다.
- Google Search Console 에서는 `http://saju-insight.co.kr/` 를 "리디렉션이 포함된 페이지"로 계속 잡을 수 있다.
- canonical/sitemap 이 실제 최종 URL과 다르면 검증 실패나 색인 지연이 발생할 수 있다.

## 조치

- canonical URL을 `https://www.saju-insight.co.kr/` 로 수정.
- sitemap URL을 `https://www.saju-insight.co.kr/` 기준으로 수정.
- robots.txt 의 sitemap 위치를 `https://www.saju-insight.co.kr/sitemap.xml` 로 수정.

## 운영 기준

- 대표 도메인은 `https://www.saju-insight.co.kr/` 로 유지한다.
- `http://` 및 non-www URL은 색인 대상이 아니라 대표 URL로 보내는 리디렉션으로 간주한다.
- Search Console 에서는 최종 대표 URL인 `https://www.saju-insight.co.kr/` 기준으로 검사한다.
