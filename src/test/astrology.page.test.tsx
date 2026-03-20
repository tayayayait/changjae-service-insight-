import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AstrologyReportView } from "@/pages/AstrologyPage";
import { buildFallbackAstrologyBirthReport, toAstrologyDeepData } from "@/lib/astrologyReport";

const createReport = () =>
  buildFallbackAstrologyBirthReport(
    toAstrologyDeepData({
      success: true,
      data: {},
      big3: {
        sun: {
          name: "Sun",
          nameKo: "태양",
          sign: "Aries",
          signKo: "양자리",
          element: "Fire",
          quality: "Cardinal",
          house: 1,
          degree: 10.2,
          retrograde: false,
          interpretation: "sun",
        },
        moon: {
          name: "Moon",
          nameKo: "달",
          sign: "Cancer",
          signKo: "게자리",
          element: "Water",
          quality: "Cardinal",
          house: 4,
          degree: 3.4,
          retrograde: false,
          interpretation: "moon",
        },
        rising: {
          sign: "Libra",
          signKo: "천칭자리",
          element: "Air",
          quality: "Cardinal",
          degree: 5.2,
          interpretation: "rising",
        },
      },
      planets: [],
      houses: [],
      aspects: [],
      elementDistribution: { fire: 4, earth: 1, air: 3, water: 2 },
      qualityDistribution: { cardinal: 5, fixed: 2, mutable: 3 },
      chartSvg: "<svg></svg>",
    }),
    { birthTimeKnown: true },
    null,
  );

describe("AstrologyReportView", () => {
  it("renders report sections in summary -> detail -> deep-data order", async () => {
    render(
      <MemoryRouter>
        <AstrologyReportView report={createReport()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("핵심 요약")).toBeInTheDocument();
    expect(screen.getByText("상세 해석")).toBeInTheDocument();
    expect(screen.getByText("심화 데이터")).toBeInTheDocument();

    const pageText = document.body.textContent || "";
    const summaryIndex = pageText.indexOf("핵심 요약");
    const detailIndex = pageText.indexOf("상세 해석");
    const deepIndex = pageText.indexOf("심화 데이터");

    expect(summaryIndex).toBeGreaterThanOrEqual(0);
    expect(detailIndex).toBeGreaterThan(summaryIndex);
    expect(deepIndex).toBeGreaterThan(detailIndex);
  });

  it("shows rule-based summary even when ai insight is missing", () => {
    const report = createReport();
    report.chapters[0].aiInsight = null;

    render(
      <MemoryRouter>
        <AstrologyReportView report={report} />
      </MemoryRouter>,
    );

    expect(screen.queryByText("AI 확장 해설")).not.toBeInTheDocument();
    expect(screen.getByText("지금 할 행동")).toBeInTheDocument();
  });
});
