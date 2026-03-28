import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import AuthCallbackPage from "@/pages/AuthCallbackPage";

const mocks = vi.hoisted(() => ({
  refreshProfile: vi.fn<() => Promise<boolean>>(),
  authState: {
    initialized: true,
    isLoading: false,
    user: null as { id: string } | null,
  },
}));

vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: (
    selector: (state: {
      initialized: boolean;
      isLoading: boolean;
      user: { id: string } | null;
      refreshProfile: () => Promise<boolean>;
    }) => unknown,
  ) =>
    selector({
      initialized: mocks.authState.initialized,
      isLoading: mocks.authState.isLoading,
      user: mocks.authState.user,
      refreshProfile: mocks.refreshProfile,
    }),
}));

const RouteProbe = () => {
  const location = useLocation();
  return <div data-testid="route-probe">{`${location.pathname}${location.search}`}</div>;
};

describe("AuthCallbackPage", () => {
  beforeEach(() => {
    mocks.refreshProfile.mockReset();
    mocks.authState.initialized = true;
    mocks.authState.isLoading = false;
    mocks.authState.user = null;
  });

  it("moves guest user back to login with safe next", async () => {
    render(
      <MemoryRouter initialEntries={["/auth/callback?next=%2Fchat"]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/login" element={<RouteProbe />} />
          <Route path="/chat" element={<RouteProbe />} />
          <Route path="/setup-profile" element={<RouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("route-probe")).toHaveTextContent("/login?next=%2Fchat");
    });
  });

  it("moves authenticated user with profile to next path", async () => {
    mocks.authState.user = { id: "u1" };
    mocks.refreshProfile.mockResolvedValueOnce(true);

    render(
      <MemoryRouter initialEntries={["/auth/callback?next=%2Fchat"]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/login" element={<RouteProbe />} />
          <Route path="/chat" element={<RouteProbe />} />
          <Route path="/setup-profile" element={<RouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("route-probe")).toHaveTextContent("/chat");
    });
  });

  it("moves authenticated user without profile to setup-profile with next", async () => {
    mocks.authState.user = { id: "u1" };
    mocks.refreshProfile.mockResolvedValueOnce(false);

    render(
      <MemoryRouter initialEntries={["/auth/callback?next=%2Fchat"]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/login" element={<RouteProbe />} />
          <Route path="/chat" element={<RouteProbe />} />
          <Route path="/setup-profile" element={<RouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("route-probe")).toHaveTextContent("/setup-profile?next=%2Fchat");
    });
  });

  it("falls back to /chat for unsafe next path", async () => {
    mocks.authState.user = { id: "u1" };
    mocks.refreshProfile.mockResolvedValueOnce(true);

    render(
      <MemoryRouter initialEntries={["/auth/callback?next=//malicious.example"]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/login" element={<RouteProbe />} />
          <Route path="/chat" element={<RouteProbe />} />
          <Route path="/setup-profile" element={<RouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("route-probe")).toHaveTextContent("/chat");
    });
  });

  it("normalizes legacy /setup-profile next path to /chat", async () => {
    mocks.authState.user = { id: "u1" };
    mocks.refreshProfile.mockResolvedValueOnce(true);

    render(
      <MemoryRouter initialEntries={["/auth/callback?next=%2Fsetup-profile"]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/login" element={<RouteProbe />} />
          <Route path="/chat" element={<RouteProbe />} />
          <Route path="/setup-profile" element={<RouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("route-probe")).toHaveTextContent("/chat");
    });
  });
});
