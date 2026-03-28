import { beforeEach, describe, expect, it, vi } from "vitest";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

import { getAstrologyBirthReport } from "@/lib/astrologyClient";

describe("astrologyClient birth_report action", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    vi.useRealTimers();
  });

  it("fails fast when birth_report request does not resolve", async () => {
    vi.useFakeTimers();
    invokeMock.mockImplementationOnce(() => new Promise(() => {}));

    const promise = getAstrologyBirthReport({
      name: "Tester",
      year: 1995,
      month: 6,
      day: 29,
      hour: 3,
      minute: 30,
      lat: 35.8714,
      lng: 128.6014,
      tz_str: "Asia/Seoul",
      birthTimeKnown: true,
    });

    const assertion = expect(promise).rejects.toThrow("리포트 생성이 지연되고 있습니다.");

    await vi.advanceTimersByTimeAsync(55_000);
    await assertion;
  });
});
