import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import SignupPage from "@/pages/SignupPage";
import LoginPage from "@/pages/LoginPage";

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  refreshProfile: vi.fn(),
  trackEvent: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  authState: {
    user: null as unknown,
    initialized: true,
    isLoading: false,
  },
}));

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      signUp: mocks.signUp,
      signInWithPassword: mocks.signInWithPassword,
      signInWithOAuth: mocks.signInWithOAuth,
    },
  },
}));

vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: (
    selector: (state: {
      user: unknown;
      initialized: boolean;
      isLoading: boolean;
      refreshProfile: typeof mocks.refreshProfile;
    }) => unknown,
  ) =>
    selector({
      user: mocks.authState.user,
      initialized: mocks.authState.initialized,
      isLoading: mocks.authState.isLoading,
      refreshProfile: mocks.refreshProfile,
    }),
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: mocks.trackEvent,
}));

vi.mock("sonner", () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

function RouteProbe() {
  const location = useLocation();
  return <div data-testid="route-probe">{`${location.pathname}${location.search}`}</div>;
}

describe("auth onboarding routing", () => {
  beforeEach(() => {
    mocks.signUp.mockReset();
    mocks.signInWithPassword.mockReset();
    mocks.signInWithOAuth.mockReset();
    mocks.refreshProfile.mockReset();
    mocks.trackEvent.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
    mocks.authState.user = null;
    mocks.authState.initialized = true;
    mocks.authState.isLoading = false;
  });

  it("moves to verify-email when signup returns a session", async () => {
    mocks.signUp.mockResolvedValueOnce({
      data: { session: { access_token: "token" } },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/setup-profile" element={<RouteProbe />} />
          <Route path="/login" element={<RouteProbe />} />
          <Route path="/verify-email" element={<RouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "password123!" } });
    fireEvent.click(screen.getByRole("button", { name: "회원가입 시작하기" }));

    await waitFor(() => {
      expect(screen.getByTestId("route-probe")).toHaveTextContent("/verify-email");
    });

    expect(mocks.signUp).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123!",
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fchat`,
      },
    });
  });

  it("moves to verify-email when signup does not return a session", async () => {
    mocks.signUp.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/setup-profile" element={<RouteProbe />} />
          <Route path="/login" element={<RouteProbe />} />
          <Route path="/verify-email" element={<RouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "password123!" } });
    fireEvent.click(screen.getByRole("button", { name: "회원가입 시작하기" }));

    await waitFor(() => {
      expect(screen.getByTestId("route-probe")).toHaveTextContent("/verify-email");
    });
  });

  it("retries signup without redirect when Supabase rejects redirect_to allow-list", async () => {
    mocks.signUp
      .mockResolvedValueOnce({
        data: { session: null },
        error: { status: 422, message: "redirect_to is not allowed" },
      })
      .mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/setup-profile" element={<RouteProbe />} />
          <Route path="/login" element={<RouteProbe />} />
          <Route path="/verify-email" element={<RouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "password123!" } });
    fireEvent.click(screen.getByRole("button", { name: "회원가입 시작하기" }));

    await waitFor(() => {
      expect(mocks.signUp).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("route-probe")).toHaveTextContent("/verify-email");
    });

    expect(mocks.signUp).toHaveBeenNthCalledWith(1, {
      email: "user@example.com",
      password: "password123!",
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fchat`,
      },
    });
    expect(mocks.signUp).toHaveBeenNthCalledWith(2, {
      email: "user@example.com",
      password: "password123!",
    });
  });

  it("moves to setup-profile with chat next when profile is missing", async () => {
    mocks.signInWithPassword.mockResolvedValueOnce({ error: null });
    mocks.refreshProfile.mockResolvedValueOnce(false);

    render(
      <MemoryRouter initialEntries={["/login?next=%2Fsetup-profile"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup-profile" element={<RouteProbe />} />
          <Route path="/mypage" element={<RouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "password123!" } });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(screen.getByTestId("route-probe")).toHaveTextContent("/setup-profile?next=%2Fchat");
    });
  });

  it("ignores unsafe next path and moves to mypage when profile exists", async () => {
    mocks.signInWithPassword.mockResolvedValueOnce({ error: null });
    mocks.refreshProfile.mockResolvedValueOnce(true);

    render(
      <MemoryRouter initialEntries={["/login?next=//malicious.example"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup-profile" element={<RouteProbe />} />
          <Route path="/mypage" element={<RouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "password123!" } });
    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(screen.getByTestId("route-probe")).toHaveTextContent("/mypage");
    });
  });

  it("auto-moves authenticated users without profile to setup-profile with next", async () => {
    mocks.authState.user = { id: "u1" };
    mocks.refreshProfile.mockResolvedValueOnce(false);

    render(
      <MemoryRouter initialEntries={["/login?next=%2Fsetup-profile"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup-profile" element={<RouteProbe />} />
          <Route path="/mypage" element={<RouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("route-probe")).toHaveTextContent("/setup-profile?next=%2Fchat");
    });
  });

  it("starts oauth with callback redirect and safe next path", async () => {
    mocks.signInWithOAuth.mockResolvedValueOnce({ error: null });

    render(
      <MemoryRouter initialEntries={["/login?next=%2Fchat"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup-profile" element={<RouteProbe />} />
          <Route path="/mypage" element={<RouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Google로 계속하기" }));

    await waitFor(() => {
      expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=%2Fchat`,
        },
      });
    });
  });
});
