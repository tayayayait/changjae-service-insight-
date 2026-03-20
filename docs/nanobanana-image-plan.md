# Nanobanana 이미지 운영 가이드 (v1)

## 1) 정적 배포 원칙
- 런타임 생성 대신 사전 생성된 `webp` 파일을 `public/images/*`에 배포한다.
- 현재 리포지토리는 네이밍/경로 고정용 플레이스홀더 세트를 포함한다.
- 실제 배포 시 동일 파일명으로 Nanobanana 산출물을 교체한다.

## 2) 디렉터리/파일 규칙
- `public/images/fortune`
  - `fortune-hero-1..3.webp`
  - `fortune-quick-1..6.webp`
  - 모바일/데스크톱 파생: `*-mobile.webp`, `*-desktop.webp`
- `public/images/dream`
  - `dream-symbol-1..12.webp`
  - 모바일 파생: `*-mobile.webp`
- `public/images/yearly`
  - `yearly-season-1..4.webp`
  - 모바일 파생: `*-mobile.webp`

## 3) 아트 디렉션
- 고정 톤: 한지 텍스처, 절기/오행 모티프, 아이보리 배경, muted coral/sky/lavender 포인트
- 금지 톤: 보라 우주 배경, 수정구슬 클리셰, 과도한 glow/네온

## 4) 기본 프롬프트 템플릿
```text
Hanji paper texture, Korean almanac motifs, five-elements symbols, ivory background,
muted coral sky lavender accents, editorial collage composition, modern clean lighting,
no purple galaxy, no crystal ball, no neon glow, no photoreal human face
```
