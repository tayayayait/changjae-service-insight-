import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";

const mocks = vi.hoisted(() => ({
  signInWithOAuth: vi.fn(),
  signInWithPassword: vi.fn(),
  refreshProfile: vi.fn(),
  trackEvent: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      signInWithOAuth: mocks.signInWithOAuth,
      signInWithPassword: mocks.signInWithPassword,
    },
  },
}));

vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: (
    selector: (state: {
      refreshProfile: typeof mocks.refreshProfile;
      setLoginModalOpen: (open: boolean) => void;
    }) => unknown,
  ) =>
    selector({
      refreshProfile: mocks.refreshProfile,
      setLoginModalOpen: vi.fn(),
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

describe("LoginForm BFCache reset", () => {
  beforeEach(() => {
    mocks.signInWithOAuth.mockReset();
    mocks.trackEvent.mockReset();
  });

  it("resets isLoading when page is restored from BFCache", async () => {
    // OAuth는 성공(에러 없음) → 브라우저가 리다이렉트됨
    mocks.signInWithOAuth.mockResolvedValueOnce({ error: null });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginForm />
      </MemoryRouter>,
    );

    const googleButton = screen.getByRole("button", { name: "Google로 계속하기" });
    const kakaoButton = screen.getByRole("button", { name: "Kakao로 계속하기" });

    // OAuth 시작 → 로딩 상태
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Google 연결 중..." })).toBeInTheDocument();
    });

    // 모든 버튼이 비활성화되어 있어야 함
    expect(screen.getByRole("button", { name: "Google 연결 중..." })).toBeDisabled();
    expect(kakaoButton).toBeDisabled();

    // BFCache 복원 시뮬레이션: pageshow 이벤트를 persisted: true로 발생
    const pageshowEvent = new PageTransitionEvent("pageshow", { persisted: true });
    window.dispatchEvent(pageshowEvent);

    // 로딩 상태가 초기화되어야 함
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Google로 계속하기" })).toBeInTheDocument();
    });

    // 모든 버튼이 다시 활성화되어야 함
    expect(screen.getByRole("button", { name: "Google로 계속하기" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Kakao로 계속하기" })).not.toBeDisabled();
  });

  it("does not reset isLoading on normal page load (persisted=false)", async () => {
    mocks.signInWithOAuth.mockResolvedValueOnce({ error: null });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginForm />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Google로 계속하기" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Google 연결 중..." })).toBeInTheDocument();
    });

    // 일반 페이지 로드 이벤트 (persisted: false)
    const pageshowEvent = new PageTransitionEvent("pageshow", { persisted: false });
    window.dispatchEvent(pageshowEvent);

    // 로딩 상태가 유지되어야 함 (정상 흐름이므로 초기화하지 않음)
    expect(screen.getByRole("button", { name: "Google 연결 중..." })).toBeInTheDocument();
  });
});
