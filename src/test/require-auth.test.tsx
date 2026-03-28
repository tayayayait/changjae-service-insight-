import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { RequireAuth } from "@/components/routing/RequireAuth";
import { useAuthStore } from "@/store/useAuthStore";

const RouteProbe = () => {
  const location = useLocation();
  return <div>{`${location.pathname}${location.search}`}</div>;
};

const renderProtectedRoute = (
  requireProfile = false,
  unauthenticatedMode?: "redirect" | "modal",
) =>
  render(
    <MemoryRouter initialEntries={["/private"]}>
      <Routes>
        <Route
          path="/private"
          element={
            <RequireAuth
              requireProfile={requireProfile}
              unauthenticatedMode={unauthenticatedMode}
            >
              <div>private-content</div>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<RouteProbe />} />
        <Route path="/setup-profile" element={<RouteProbe />} />
      </Routes>
    </MemoryRouter>,
  );

describe("RequireAuth", () => {
  beforeEach(() => {
    useAuthStore.setState({
      initialized: true,
      isLoading: false,
      user: null,
      hasProfile: false,
    });
  });

  it("redirects guest users to login", async () => {
    useAuthStore.setState({ initialized: true, isLoading: false, user: null });

    renderProtectedRoute();

    expect(await screen.findByText("/login?next=%2Fprivate")).toBeInTheDocument();
    expect(screen.queryByText("private-content")).not.toBeInTheDocument();
  });

  it("shows protected page and opens login modal for guest users in modal mode", async () => {
    const setLoginModalOpen = vi.fn();
    useAuthStore.setState({
      initialized: true,
      isLoading: false,
      user: null,
      setLoginModalOpen,
    });

    renderProtectedRoute(false, "modal");

    expect(screen.getByText("private-content")).toBeInTheDocument();
    expect(screen.queryByText("/login?next=%2Fprivate")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(setLoginModalOpen).toHaveBeenCalledWith(true);
    });
  });

  it("shows auth loading indicator before initialization", () => {
    useAuthStore.setState({ initialized: false, isLoading: true, user: null });

    renderProtectedRoute();

    expect(screen.getByLabelText("auth-loading")).toBeInTheDocument();
  });

  it("renders protected content for authenticated users", async () => {
    useAuthStore.setState({
      initialized: true,
      isLoading: false,
      user: { id: "user-id" } as unknown as User,
      hasProfile: true,
    });

    renderProtectedRoute();

    expect(await screen.findByText("private-content")).toBeInTheDocument();
    expect(screen.queryByText("/login?next=%2Fprivate")).not.toBeInTheDocument();
  });

  it("redirects authenticated users without profile when requireProfile is enabled", async () => {
    useAuthStore.setState({
      initialized: true,
      isLoading: false,
      user: { id: "user-id" } as unknown as User,
      hasProfile: false,
    });

    renderProtectedRoute(true);

    expect(await screen.findByText("/setup-profile?next=%2Fprivate")).toBeInTheDocument();
    expect(screen.queryByText("private-content")).not.toBeInTheDocument();
  });
});
