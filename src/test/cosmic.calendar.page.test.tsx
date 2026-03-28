import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CosmicCalendarPage from "@/pages/CosmicCalendarPage";
import { useAuthStore } from "@/store/useAuthStore";
import { useConsultStore } from "@/store/useConsultStore";

const mockFns = vi.hoisted(() => ({
  getAstrologyAICalendar: vi.fn(),
}));

vi.mock("@/lib/astrologyClient", () => ({
  getAstrologyAICalendar: mockFns.getAstrologyAICalendar,
}));

const buildCalendarPayload = (year: number, month: number) => ({
  success: true,
  year,
  month,
  summary: {
    headline: "monthly headline",
    focus: "monthly focus",
    caution: "monthly caution",
  },
  highlights: [
    { title: "h1", score: 82, note: "n1" },
    { title: "h2", score: 68, note: "n2" },
    { title: "h3", score: 41, note: "n3" },
    { title: "h4", score: 64, note: "n4" },
  ],
  priorityActions: ["action-1", "action-2", "action-3"],
  choiceGuides: [
    {
      id: "career",
      title: "career",
      guidance: "career guidance",
      recommendedAction: "career do",
      avoidAction: "career dont",
    },
    {
      id: "relationship",
      title: "relationship",
      guidance: "relationship guidance",
      recommendedAction: "relationship do",
      avoidAction: "relationship dont",
    },
    {
      id: "energy",
      title: "energy",
      guidance: "energy guidance",
      recommendedAction: "energy do",
      avoidAction: "energy dont",
    },
    {
      id: "money",
      title: "money",
      guidance: "money guidance",
      recommendedAction: "money do",
      avoidAction: "money dont",
    },
  ],
  phaseGuides: [
    { phase: "early", title: "early", meaning: "m1", action: "a1", impact: "medium" },
    { phase: "mid", title: "mid", meaning: "m2", action: "a2", impact: "high" },
    { phase: "late", title: "late", meaning: "m3", action: "a3", impact: "low" },
  ],
  avoidList: ["avoid-1", "avoid-2", "avoid-3"],
  expertNotes: [
    {
      label: "Mercury Rx",
      plainMeaning: "check details",
      sourceType: "transit",
    },
  ],
  deepData: {
    sourceNotes: ["source-note"],
    transits: [],
    generationMode: "deterministic",
    calculationBasis: "CircularNatalHoroscopeJS@1.1.0",
    analysisWindow: {
      year,
      month,
      daysAnalyzed: 31,
      transitTime: "12:00",
      phaseBuckets: ["1-10", "11-20", "21-end"],
    },
    birthTimeAccuracy: "known",
  },
});

const fillRequiredInputs = () => {
  fireEvent.change(screen.getByLabelText("cosmic-name-input"), {
    target: { value: "Manual User" },
  });
  fireEvent.change(screen.getByLabelText("cosmic-birth-date-input"), {
    target: { value: "1990-04-05" },
  });
  fireEvent.change(screen.getByLabelText("cosmic-location-select"), {
    target: { value: "seoul" },
  });
};

const fillRequiredInputsAndSubmit = () => {
  fillRequiredInputs();
  fireEvent.click(screen.getByLabelText("cosmic-run-button"));
};

describe("CosmicCalendarPage", () => {
  beforeEach(() => {
    vi.useRealTimers();
    mockFns.getAstrologyAICalendar.mockReset();
    useAuthStore.setState({ profile: null });
    useConsultStore.setState({ userProfile: {} });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not auto-run and uses only manually entered profile", async () => {
    mockFns.getAstrologyAICalendar.mockImplementationOnce(async (year: number, month: number) =>
      buildCalendarPayload(year, month),
    );

    useAuthStore.setState({
      profile: {
        name: "Auth Profile",
        year: 1981,
        month: 1,
        day: 2,
      },
    });
    useConsultStore.setState({
      userProfile: {
        name: "Consult Profile",
        year: 1975,
        month: 12,
        day: 31,
      },
    });

    render(
      <MemoryRouter>
        <CosmicCalendarPage />
      </MemoryRouter>,
    );

    expect(mockFns.getAstrologyAICalendar).not.toHaveBeenCalled();
    expect(screen.getByLabelText("cosmic-name-input")).toHaveValue("");
    expect(screen.getByLabelText("cosmic-birth-date-input")).toHaveValue("");

    fillRequiredInputsAndSubmit();

    await screen.findByText("monthly headline");

    expect(screen.getByText("monthly focus")).toBeInTheDocument();
    expect(screen.getByText((text) => text.includes("action-1"))).toBeInTheDocument();
    expect(screen.getByText("career guidance")).toBeInTheDocument();
    expect(screen.getByText((text) => text.includes("avoid-1"))).toBeInTheDocument();

    const [, , requestProfile] = mockFns.getAstrologyAICalendar.mock.calls[0] ?? [];
    expect(requestProfile).toEqual(
      expect.objectContaining({
        name: "Manual User",
        year: 1990,
        month: 4,
        day: 5,
      }),
    );
  });

  it("renders safely when expert notes is empty", async () => {
    const payload = buildCalendarPayload(2026, 3);
    payload.expertNotes = [];
    mockFns.getAstrologyAICalendar.mockResolvedValueOnce(payload);

    render(
      <MemoryRouter>
        <CosmicCalendarPage />
      </MemoryRouter>,
    );

    fillRequiredInputsAndSubmit();

    await screen.findByText("monthly headline");
    expect(screen.getByText((text) => text.includes("action-1"))).toBeInTheDocument();
  });

  it("shows api error state when request fails", async () => {
    mockFns.getAstrologyAICalendar.mockRejectedValueOnce(new Error("calc unavailable"));

    render(
      <MemoryRouter>
        <CosmicCalendarPage />
      </MemoryRouter>,
    );

    fillRequiredInputsAndSubmit();

    await waitFor(() => {
      expect(screen.getByText("calc unavailable")).toBeInTheDocument();
    });
  });

  it("updates heading at KST month rollover without auto-fetch", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-31T14:59:59.000Z"));

    render(
      <MemoryRouter>
        <CosmicCalendarPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/2026.*3/)).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(1_100);

    await waitFor(() => {
      expect(screen.getByText(/2026.*4/)).toBeInTheDocument();
    });
    expect(mockFns.getAstrologyAICalendar).not.toHaveBeenCalled();
  });

  it("clears result and inputs after KST month rollover", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-31T14:59:59.000Z"));
    mockFns.getAstrologyAICalendar.mockResolvedValueOnce(buildCalendarPayload(2026, 3));

    render(
      <MemoryRouter>
        <CosmicCalendarPage />
      </MemoryRouter>,
    );

    fillRequiredInputsAndSubmit();
    await screen.findByText("monthly headline");
    expect(screen.getByLabelText("cosmic-name-input")).toHaveValue("Manual User");

    await vi.advanceTimersByTimeAsync(1_100);

    await waitFor(() => {
      expect(screen.getByText(/2026.*4/)).toBeInTheDocument();
    });

    expect(screen.queryByText("monthly headline")).not.toBeInTheDocument();
    expect(screen.getByLabelText("cosmic-name-input")).toHaveValue("");
    expect(screen.getByLabelText("cosmic-birth-date-input")).toHaveValue("");
    expect(screen.getByLabelText("cosmic-location-select")).toHaveValue("");
  });

  it("reuses in-memory result for same month and same input", async () => {
    mockFns.getAstrologyAICalendar.mockResolvedValue(buildCalendarPayload(2026, 3));

    render(
      <MemoryRouter>
        <CosmicCalendarPage />
      </MemoryRouter>,
    );

    fillRequiredInputsAndSubmit();
    await screen.findByText("monthly headline");
    expect(mockFns.getAstrologyAICalendar).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText("cosmic-run-button"));

    await waitFor(() => {
      expect(mockFns.getAstrologyAICalendar).toHaveBeenCalledTimes(1);
    });
  });
});
