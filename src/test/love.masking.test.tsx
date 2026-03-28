import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CounselSectionCard } from "@/components/love/CounselSectionCard";
import { LockedChapterCard } from "@/components/love/LockedChapterCard";
import {
  CoupleReportView,
  FuturePartnerReportView,
  ReunionReportView,
} from "@/components/love/LoveReportViews";
import { LoveReportPreviewV3 } from "@/types/love";

const baseSection = {
  id: "opening",
  navLabel: "OPEN",
  title: "Core Theme",
  coreQuestion: "What matters now?",
  verdict: "Keep your pace and filter carefully.",
  analysisParagraphs: ["Detailed analysis paragraph A", "Detailed analysis paragraph B"],
  interpretationPoints: ["Point A", "Point B", "Point C"],
  actionTitle: "Action",
  actionItems: ["Action A", "Action B", "Action C"],
  warningNote: "Do not rush your conclusion.",
};

const basePreview = (serviceType: LoveReportPreviewV3["serviceType"]): LoveReportPreviewV3 => ({
  headline: "Preview headline",
  summary: "Preview summary",
  serviceType,
  reportLayout:
    serviceType === "future-partner"
      ? "future-partner-v3"
      : serviceType === "couple-report"
        ? "couple-report-v3"
        : "crush-reunion-v3",
  scoreSet: {
    overall: 72,
    pull: 71,
    pace: 68,
    alignment: 70,
    repair: 65,
    timing: 73,
  },
  quickCounsel: {
    diagnosis: "Quick diagnosis",
    temperatureLabel: "Level",
    temperatureText: "Warm",
    immediateAction: "Observe before acting",
  },
  previewHighlights: ["Highlight A", "Highlight B", "Highlight C"],
  openSection: baseSection,
  lockedSectionSummaries: [
    {
      id: "locked-1",
      title: "Locked Chapter 1",
      teaser: "Teaser 1",
      benefit: "Benefit 1",
    },
    {
      id: "locked-2",
      title: "Locked Chapter 2",
      teaser: "Teaser 2",
      benefit: "Benefit 2",
    },
  ],
  ctaReason: "Unlock for full report",
  confidenceSummary: "Confidence summary",
  nextRefreshAt: "2026-04-24T00:00:00.000Z",
});

const futureFullReport = {
  headline: "Preview headline",
  summary: "Preview summary",
  serviceType: "future-partner" as const,
  reportLayout: "future-partner-v3" as const,
  scoreSet: {
    overall: 72,
    pull: 71,
    pace: 68,
    alignment: 70,
    repair: 65,
    timing: 73,
  },
  sections: [
    baseSection,
    {
      ...baseSection,
      id: "evidence-note",
      title: "Evidence",
      analysisParagraphs: ["Evidence text"],
    },
  ],
  scoreNarratives: [],
  actionRoadmap: {
    now: ["Now action"],
    within7Days: ["7-day action"],
    within30Days: ["30-day action"],
  },
  serviceInsights: {
    kind: "future-partner" as const,
    partnerProfile: {
      matchKeywords: ["Kind"],
      avoidKeywords: ["Unclear"],
      idealDescription: "Stable and practical",
    },
    meetingChannels: ["Channel A"],
    greenFlags: ["Green flag"],
    redFlags: ["Red flag"],
    selfCheckCriteria: ["Check A"],
  },
  conversationPrompts: ["Prompt A"],
  avoidList: ["Avoid A"],
  confidenceNotes: ["Confidence A"],
  nextRefreshAt: "2026-04-24T00:00:00.000Z",
};

describe("Love report masking", () => {
  it("keeps verdict visible while masking detailed body", () => {
    render(<CounselSectionCard section={baseSection} masked />);

    expect(screen.getByText("Keep your pace and filter carefully.")).toBeInTheDocument();
    expect(screen.getByTestId("counsel-section-mask-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("counsel-section-masked-body")).toHaveAttribute("aria-hidden", "true");
  });

  it("shows full section content when masking is disabled", () => {
    render(<CounselSectionCard section={baseSection} />);

    expect(screen.getByText("Detailed analysis paragraph A")).toBeInTheDocument();
    expect(screen.queryByTestId("counsel-section-mask-overlay")).not.toBeInTheDocument();
  });

  it("applies strong mask to locked chapter summaries", () => {
    render(
      <LockedChapterCard
        chapter={{
          id: "locked",
          title: "Locked Chapter",
          teaser: "Locked teaser text",
          benefit: "Locked benefit text",
        }}
        masked
      />,
    );

    expect(screen.getByTestId("locked-chapter-mask-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("locked-chapter-masked-body")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders masked free branch in future partner view", () => {
    render(<FuturePartnerReportView preview={basePreview("future-partner")} isUnlocked={false} />);

    expect(screen.getByText("Highlight A")).toBeInTheDocument();
    expect(screen.getByTestId("counsel-section-mask-overlay")).toBeInTheDocument();
    expect(screen.getAllByTestId("locked-chapter-mask-overlay").length).toBeGreaterThan(0);
  });

  it("renders masked free branch in couple view", () => {
    render(<CoupleReportView preview={basePreview("couple-report")} isUnlocked={false} />);

    expect(screen.getByText("Highlight A")).toBeInTheDocument();
    expect(screen.getByTestId("counsel-section-mask-overlay")).toBeInTheDocument();
    expect(screen.getAllByTestId("locked-chapter-mask-overlay").length).toBeGreaterThan(0);
  });

  it("renders masked free branch in reunion view", () => {
    render(<ReunionReportView preview={basePreview("crush-reunion")} isUnlocked={false} />);

    expect(screen.getByText("Highlight A")).toBeInTheDocument();
    expect(screen.getByTestId("counsel-section-mask-overlay")).toBeInTheDocument();
    expect(screen.getAllByTestId("locked-chapter-mask-overlay").length).toBeGreaterThan(0);
  });

  it("removes masks in unlocked branch", () => {
    render(
      <FuturePartnerReportView
        preview={basePreview("future-partner")}
        fullReport={futureFullReport}
        isUnlocked
      />,
    );

    expect(screen.getByText("Detailed analysis paragraph A")).toBeInTheDocument();
    expect(screen.queryByTestId("counsel-section-mask-overlay")).not.toBeInTheDocument();
    expect(screen.queryByTestId("locked-chapter-mask-overlay")).not.toBeInTheDocument();
  });
});
