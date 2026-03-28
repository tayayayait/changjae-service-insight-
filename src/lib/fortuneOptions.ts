import { GoodDayEventType } from "@/types/result";

export const FORTUNE_PERIOD_OPTIONS = [
  { label: "오늘", value: "today" },
] as const;

export const ZODIAC_OPTIONS = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"] as const;

export const STAR_SIGN_OPTIONS = [
  "양자리",
  "황소자리",
  "쌍둥이자리",
  "게자리",
  "사자자리",
  "처녀자리",
  "천칭자리",
  "전갈자리",
  "사수자리",
  "염소자리",
  "물병자리",
  "물고기자리",
] as const;

export const GOOD_DAY_EVENT_OPTIONS: Array<{ label: string; value: GoodDayEventType }> = [
  { label: "이사", value: "move" },
  { label: "계약", value: "contract" },
  { label: "고백", value: "confession" },
  { label: "발표", value: "announcement" },
];
