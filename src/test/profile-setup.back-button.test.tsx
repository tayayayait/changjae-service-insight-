import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import ProfileSetup from "@/pages/ProfileSetup";
import { useAuthStore } from "@/store/useAuthStore";

const RouteProbe = () => {
  const location = useLocation();
  return <div data-testid="route-probe">{`${location.pathname}${location.search}`}</div>;
};

describe("ProfileSetup back button", () => {
  beforeEach(() => {
    useAuthStore.setState({
      initialized: true,
      isLoading: false,
      user: { id: "user-id" } as unknown as User,
      hasProfile: false,
      profile: null,
    });
  });

  it("moves directly to home", async () => {
    render(
      <MemoryRouter initialEntries={["/setup-profile"]}>
        <Routes>
          <Route path="/setup-profile" element={<ProfileSetup />} />
          <Route path="/" element={<RouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    const backButton = document.querySelector("button[aria-label]");
    expect(backButton).not.toBeNull();
    fireEvent.click(backButton as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByTestId("route-probe")).toHaveTextContent("/");
    });
  });
});
