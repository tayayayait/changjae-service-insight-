import { AstrologyBirthReportResult } from "./result";

export interface AstrologyReportRecord {
  id: string;
  userId: string | null;
  guestId: string | null;
  serviceType: string;
  inputSnapshot: Record<string, unknown>;
  inputFingerprint: string;
  reportPayload: AstrologyBirthReportResult;
  templateVersion: string;
  isUnlocked?: boolean;
  createdAt: string;
}
