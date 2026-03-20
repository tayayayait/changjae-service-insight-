import {
  AnyLoveScoreSet,
  LegacyLoveReportFull,
  LegacyLoveReportPreview,
  LegacyLoveScoreSet,
  LoveReportRecord,
  LoveReportVersion,
  LoveScoreSet,
} from "@/types/love";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(value)));

const EMPTY_SCORE_SET: LoveScoreSet = {
  overall: 0,
  pull: 0,
  pace: 0,
  alignment: 0,
  repair: 0,
  timing: 0,
};

export const isLegacyScoreSet = (scoreSet?: AnyLoveScoreSet | null): scoreSet is LegacyLoveScoreSet => {
  return Boolean(scoreSet && "emotion" in scoreSet);
};

export const normalizeLegacyScoreSet = (scoreSet: LegacyLoveScoreSet): LoveScoreSet => {
  return {
    overall: clamp(scoreSet.overall),
    pull: clamp(scoreSet.emotion),
    pace: clamp((scoreSet.emotion + scoreSet.timingConfidence) / 2),
    alignment: clamp((scoreSet.communication + scoreSet.stability) / 2),
    repair: clamp((scoreSet.communication + scoreSet.longTerm) / 2),
    timing: clamp(scoreSet.timingConfidence, 20, 100),
  };
};

export const normalizeLoveScoreSet = (scoreSet?: AnyLoveScoreSet | null): LoveScoreSet => {
  if (!scoreSet) {
    return EMPTY_SCORE_SET;
  }

  if (isLegacyScoreSet(scoreSet)) {
    return normalizeLegacyScoreSet(scoreSet);
  }

  return {
    overall: clamp(scoreSet.overall),
    pull: clamp(scoreSet.pull),
    pace: clamp(scoreSet.pace),
    alignment: clamp(scoreSet.alignment),
    repair: clamp(scoreSet.repair),
    timing: clamp(scoreSet.timing, 20, 100),
  };
};

export const isLegacyLovePreview = (
  preview: LoveReportRecord["preview"] | undefined,
): preview is LegacyLoveReportPreview => {
  return Boolean(preview && "openChapter" in preview);
};

export const isLegacyLoveFullReport = (
  fullReport: LoveReportRecord["fullReport"] | undefined,
): fullReport is LegacyLoveReportFull => {
  return Boolean(fullReport && "chapters" in fullReport);
};

export const inferLoveReportVersion = (record: Partial<LoveReportRecord>): LoveReportVersion => {
  if (record.reportVersion) {
    return record.reportVersion;
  }

  if (isLegacyLovePreview(record.preview) || isLegacyLoveFullReport(record.fullReport)) {
    return "v1-story";
  }

  return "v2-counsel";
};
