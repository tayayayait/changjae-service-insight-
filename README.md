# 사주운세 플랫폼

사주/운세/궁합을 서비스 허브형 홈에서 탐색하고, 9단계 입력 퍼널로 분석 결과를 확인하는 웹 애플리케이션입니다.

## 실행

```bash
pnpm install
pnpm dev
```

## 운세 라우팅

- 허브: `/fortune`
- 간편 운세: `/fortune/quick`
- 내 사주 운세: `/fortune/personal`
- 꿈해몽: `/fortune/dream`
- 연간운: `/fortune/yearly`
- 길일 캘린더: `/fortune/good-days`
- 미래 배우자: `/love/future-partner`
- 커플 궁합: `/love/couple-report`
- 짝사랑·재회: `/love/crush-reunion`

## 환경 변수

프런트 `.env`:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Supabase Edge Function Secret:

```bash
GEMINI_API_KEY=...
DATA_ENCRYPTION_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 운영 정책

- 운세/꿈해몽/궁합 API 실패 시 임의 점수·임의 해석을 반환하지 않습니다.
- 프런트는 실패를 오류 상태로 처리하고 `재시도` 버튼을 노출합니다.
- 저장 정책은 사주/궁합/개인 운세/꿈해몽 저장, 간편 운세/길일 조회형(비저장)입니다.
- Supabase seed는 기본 비활성화(`supabase/config.toml`의 `[db.seed].enabled = false`)입니다.

## 배포

- Vercel SPA rewrite: `vercel.json`
- Vercel 설정 및 체크리스트: `docs/vercel-deploy.md`
- Supabase 수동 배포: `docs/supabase-manual-deploy.md`

## 문서

- `docs/architecture.md`
- `docs/data-flow.md`
- `docs/ui-ux-spec.md`
- `docs/love-category.md`
- `docs/nanobanana-image-plan.md`
- `docs/vercel-deploy.md`
- `docs/supabase-manual-deploy.md`
- `docs/astrology-backend.md`

## 검증

```bash
npm test
npm run build
npm run lint
```
