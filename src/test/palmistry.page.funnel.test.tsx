import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PalmistryPage from "@/pages/PalmistryPage";

const getPalmistryAnalysisMock = vi.hoisted(() => vi.fn());
const askPalmistryQuestionMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/astrologyClient", () => ({
  getPalmistryAnalysis: getPalmistryAnalysisMock,
  askPalmistryQuestion: askPalmistryQuestionMock,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: (selector: (state: { isPremium: boolean }) => unknown) => selector({ isPremium: false }),
}));

class MockFileReader {
  result = "data:image/png;base64,MOCK_IMAGE_DATA";
  onloadend: null | (() => void) = null;

  readAsDataURL() {
    if (this.onloadend) {
      this.onloadend();
    }
  }
}

const createPalmResult = (withOverlay: boolean) => ({
  classification: { palm_type: "balanced", dominant_line: "Life", confidence: 0.81 },
  interpretation: "summary",
  lines: {
    life: { visible: true, length: "long", depth: "medium", curvature: "curved", breaks: 0, branches: 1, description: "life" },
    heart: { visible: true, length: "medium", depth: "deep", curvature: "slight", breaks: 0, branches: 0, description: "heart" },
    head: { visible: true, length: "medium", depth: "medium", curvature: "straight", breaks: 0, branches: 0, description: "head" },
    fate: { visible: true, length: "short", depth: "shallow", curvature: "straight", breaks: 0, branches: 0, description: "fate" },
  },
  sections: {
    personality: { summary: "personality summary", details: ["p1", "p2"] },
    wealth_career: { summary: "wealth summary", details: ["w1", "w2"] },
    relationship: { summary: "relationship summary", details: ["r1", "r2"] },
    timing: { summary: "timing summary", details: ["t1", "t2"] },
  },
  quality: {
    overall: 0.8,
    reasons: [],
    hand_detected: true,
    palm_centered: true,
    blur_score: 0.8,
    exposure_score: 0.8,
  },
  overlay: withOverlay
    ? {
        lines: {
          heart: { points: [{ x: 0.2, y: 0.2 }, { x: 0.8, y: 0.3 }] },
          head: { points: [{ x: 0.2, y: 0.45 }, { x: 0.8, y: 0.5 }] },
          life: { points: [{ x: 0.35, y: 0.2 }, { x: 0.4, y: 0.8 }] },
          fate: { points: [{ x: 0.55, y: 0.2 }, { x: 0.55, y: 0.8 }] },
        },
        labels: {
          heart: { x: 0.82, y: 0.28 },
          head: { x: 0.82, y: 0.52 },
          life: { x: 0.42, y: 0.82 },
          fate: { x: 0.57, y: 0.82 },
        },
      }
    : undefined,
});

const renderPalmistryPage = () =>
  render(
    <MemoryRouter initialEntries={["/palmistry?mode=main&section=personality"]}>
      <Routes>
        <Route path="/palmistry" element={<PalmistryPage />} />
      </Routes>
    </MemoryRouter>,
  );

const uploadPalmImage = () => {
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  expect(fileInput).toBeTruthy();
  const file = new File(["mock"], "palm.png", { type: "image/png" });
  fireEvent.change(fileInput, { target: { files: [file] } });
};

describe("PalmistryPage main funnel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as { FileReader?: unknown }).FileReader = MockFileReader as unknown as typeof FileReader;
  });

  it("moves through upload -> thickness -> nail -> analyzing -> result and sends auxiliary payload", async () => {
    let resolveAnalysis: ((value: unknown) => void) | null = null;
    const pending = new Promise((resolve) => {
      resolveAnalysis = resolve;
    });

    getPalmistryAnalysisMock.mockReturnValueOnce(pending);

    renderPalmistryPage();
    expect(screen.getByTestId("palm-main-step-upload")).toBeInTheDocument();

    uploadPalmImage();
    fireEvent.click(screen.getByTestId("palm-main-next-auxiliary"));

    expect(screen.getByTestId("palm-main-step-thickness")).toBeInTheDocument();
    const normalThicknessThumb = document.querySelector('img[src="/images/palmistry/normal-palm.png"]');
    expect(normalThicknessThumb).toBeTruthy();
    fireEvent.click(normalThicknessThumb as Element);

    fireEvent.click(screen.getByTestId("palm-main-next-nail"));

    expect(screen.getByTestId("palm-main-step-nail")).toBeInTheDocument();
    const squareNailThumb = document.querySelector('img[src="/images/palmistry/square-nails.svg"]');
    expect(squareNailThumb).toBeTruthy();
    expect(squareNailThumb).not.toHaveClass("object-top");

    const startButton = screen.getByTestId("palm-main-analyze-start");
    expect(startButton).toBeDisabled();

    fireEvent.click(squareNailThumb as Element);
    expect(startButton).toBeEnabled();

    fireEvent.click(startButton);
    expect(screen.getByTestId("palm-main-step-analyzing")).toBeInTheDocument();

    expect(getPalmistryAnalysisMock).toHaveBeenCalledWith("data:image/png;base64,MOCK_IMAGE_DATA", {
      palmThickness: "normal",
      nailShape: "square",
    });

    resolveAnalysis?.({
      success: true,
      result: createPalmResult(true),
    });

    await waitFor(() => {
      expect(screen.getByTestId("palm-main-step-result")).toBeInTheDocument();
    });
    expect(screen.getByTestId("palm-overlay-svg")).toBeInTheDocument();
  });

  it("shows overlay fallback message when overlay data is missing", async () => {
    getPalmistryAnalysisMock.mockResolvedValueOnce({
      success: true,
      result: createPalmResult(false),
    });

    renderPalmistryPage();
    uploadPalmImage();
    fireEvent.click(screen.getByTestId("palm-main-next-auxiliary"));

    const thinThicknessThumb = document.querySelector('img[src="/images/palmistry/thin-palm.png"]');
    expect(thinThicknessThumb).toBeTruthy();
    fireEvent.click(thinThicknessThumb as Element);

    fireEvent.click(screen.getByTestId("palm-main-next-nail"));

    const roundNailThumb = document.querySelector('img[src="/images/palmistry/round-nails.svg"]');
    expect(roundNailThumb).toBeTruthy();
    fireEvent.click(roundNailThumb as Element);

    fireEvent.click(screen.getByTestId("palm-main-analyze-start"));

    await waitFor(() => {
      expect(screen.getByTestId("palm-main-step-result")).toBeInTheDocument();
    });

    expect(screen.getByTestId("palm-overlay-fallback")).toBeInTheDocument();
  });
});

