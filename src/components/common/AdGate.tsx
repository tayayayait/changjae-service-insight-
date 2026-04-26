import type { ReactNode } from "react";

interface AdGateProps {
  /** Kept for caller compatibility. AdSense ads must not gate content. */
  enabled: boolean;
  /** Kept for caller compatibility. */
  countdownSec?: number;
  children: ReactNode;
}

/**
 * Compatibility wrapper for former result gates.
 *
 * Google AdSense non-rewarded ads must not be displayed as a fixed countdown
 * gate before users can view page content. The wrapper now renders content
 * immediately and leaves compliant in-page ad placements to `AdUnit`.
 */
export function AdGate({ children }: AdGateProps) {
  return <>{children}</>;
}
