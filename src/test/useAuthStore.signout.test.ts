import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/store/useAuthStore";

const signOutMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const selectMock = vi.hoisted(() => vi.fn());
const eqMock = vi.hoisted(() => vi.fn());
const maybeSingleMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signOut: signOutMock,
      getSession: getSessionMock,
    },
    from: fromMock,
  },
}));

describe("useAuthStore", () => {
  beforeEach(() => {
    signOutMock.mockReset();
    getSessionMock.mockReset();
    fromMock.mockReset();
    selectMock.mockReset();
    eqMock.mockReset();
    maybeSingleMock.mockReset();

    fromMock.mockReturnValue({
      select: selectMock,
    });
    selectMock.mockReturnValue({
      eq: eqMock,
    });
    eqMock.mockReturnValue({
      maybeSingle: maybeSingleMock,
    });

    getSessionMock.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({
      data: null,
      error: null,
    });

    useAuthStore.setState({
      user: { id: "user-1" } as never,
      session: { access_token: "token" } as never,
      isLoading: true,
      initialized: false,
      profile: {
        name: "tester",
        gender: "male",
        calendar_type: "solar",
        year: 1990,
        month: 1,
        day: 1,
      },
      hasProfile: true,
      isPremium: true,
      isLoginModalOpen: true,
    });
  });

  it("clears auth state and closes login modal on successful sign out", async () => {
    signOutMock.mockResolvedValueOnce({ error: null });

    await useAuthStore.getState().signOut();

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().profile).toBeNull();
    expect(useAuthStore.getState().hasProfile).toBe(false);
    expect(useAuthStore.getState().isPremium).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().initialized).toBe(true);
    expect(useAuthStore.getState().isLoginModalOpen).toBe(false);
  });

  it("still clears local auth state when provider sign out throws", async () => {
    signOutMock.mockRejectedValueOnce(new Error("network failed"));

    await useAuthStore.getState().signOut();

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().profile).toBeNull();
    expect(useAuthStore.getState().isLoginModalOpen).toBe(false);
  });

  it("refreshes profile from auth session when user state is not synced yet", async () => {
    const sessionUser = { id: "user-session-1" };

    useAuthStore.setState({
      user: null,
      session: null,
      profile: null,
      hasProfile: false,
      isPremium: false,
    });

    getSessionMock.mockResolvedValueOnce({
      data: { session: { user: sessionUser } },
      error: null,
    });
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        name: "홍길동",
        gender: "male",
        calendar_type: "solar",
        year: 1990,
        month: 1,
        day: 1,
      },
      error: null,
    });

    const hasProfile = await useAuthStore.getState().refreshProfile();

    expect(hasProfile).toBe(true);
    expect(getSessionMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith("user_profiles");
    expect(useAuthStore.getState().user?.id).toBe("user-session-1");
    expect(useAuthStore.getState().hasProfile).toBe(true);
  });
});
