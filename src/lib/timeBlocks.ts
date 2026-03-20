export interface TimeBlock {
  id: string;
  label: string;
  range: string;
  midHour: number;
  midMinute: number;
}

export const TIME_BLOCKS: TimeBlock[] = [
  { id: "ja-si", label: "자시", range: "23:30~01:29", midHour: 0, midMinute: 30 },
  { id: "chuk-si", label: "축시", range: "01:30~03:29", midHour: 2, midMinute: 30 },
  { id: "in-si", label: "인시", range: "03:30~05:29", midHour: 4, midMinute: 30 },
  { id: "myo-si", label: "묘시", range: "05:30~07:29", midHour: 6, midMinute: 30 },
  { id: "jin-si", label: "진시", range: "07:30~09:29", midHour: 8, midMinute: 30 },
  { id: "sa-si", label: "사시", range: "09:30~11:29", midHour: 10, midMinute: 30 },
  { id: "o-si", label: "오시", range: "11:30~13:29", midHour: 12, midMinute: 30 },
  { id: "mi-si", label: "미시", range: "13:30~15:29", midHour: 14, midMinute: 30 },
  { id: "sin-si", label: "신시", range: "15:30~17:29", midHour: 16, midMinute: 30 },
  { id: "yu-si", label: "유시", range: "17:30~19:29", midHour: 18, midMinute: 30 },
  { id: "sul-si", label: "술시", range: "19:30~21:29", midHour: 20, midMinute: 30 },
  { id: "hae-si", label: "해시", range: "21:30~23:29", midHour: 22, midMinute: 30 },
];

const LEGACY_TIME_BLOCK_TO_NEW_ID: Record<string, string> = {
  dawn: "in-si",
  morning: "jin-si",
  forenoon: "sa-si",
  noon: "o-si",
  afternoon: "mi-si",
  evening: "sul-si",
  night: "hae-si",
};

const LEGACY_LABEL_TO_NEW_ID: Record<string, string> = {
  자시: "ja-si",
  축시: "chuk-si",
  인시: "in-si",
  묘시: "myo-si",
  진시: "jin-si",
  사시: "sa-si",
  오시: "o-si",
  미시: "mi-si",
  신시: "sin-si",
  유시: "yu-si",
  술시: "sul-si",
  해시: "hae-si",
};

export function normalizeTimeBlockId(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const direct = TIME_BLOCKS.find((block) => block.id === value);
  if (direct) {
    return direct.id;
  }

  const mappedLegacy = LEGACY_TIME_BLOCK_TO_NEW_ID[value];
  if (mappedLegacy) {
    return mappedLegacy;
  }

  const mappedLabel = LEGACY_LABEL_TO_NEW_ID[value];
  if (mappedLabel) {
    return mappedLabel;
  }

  const matchedByContains = TIME_BLOCKS.find((block) => value.includes(block.label));
  return matchedByContains?.id ?? null;
}

export function getTimeBlock(idOrLabel?: string | null): TimeBlock | null {
  const normalizedId = normalizeTimeBlockId(idOrLabel);
  if (!normalizedId) {
    return null;
  }
  return TIME_BLOCKS.find((b) => b.id === normalizedId) ?? null;
}

export function getTimeBlockLabel(idOrLabel: string): string {
  const block = getTimeBlock(idOrLabel);
  if (!block) return "모름";
  return `${block.label} (${block.range})`;
}
