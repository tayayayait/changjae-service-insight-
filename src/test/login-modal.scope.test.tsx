import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuthStore } from "@/store/useAuthStore";

vi.mock("@/components/auth/LoginForm", () => ({
  LoginForm: () => <div>login-form</div>,
}));

const TestShell = () => (
  <>
    <LoginModal />
    <Routes>
      <Route
        path="/chat"
        element={<Link to="/category/saju">go-category</Link>}
      />
      <Route path="/category/saju" element={<div>category-page</div>} />
    </Routes>
  </>
);

describe("LoginModal route scope", () => {
  beforeEach(() => {
    useAuthStore.setState({ isLoginModalOpen: false });
  });

  it("closes immediately when leaving /chat", async () => {
    useAuthStore.setState({ isLoginModalOpen: true });

    render(
      <MemoryRouter initialEntries={["/chat"]}>
        <TestShell />
      </MemoryRouter>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "go-category" }));
    expect(await screen.findByText("category-page")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(useAuthStore.getState().isLoginModalOpen).toBe(false);
    });
  });

  it("does not render on non-chat routes even when stale open state exists", async () => {
    useAuthStore.setState({ isLoginModalOpen: true });

    render(
      <MemoryRouter initialEntries={["/category/saju"]}>
        <TestShell />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(useAuthStore.getState().isLoginModalOpen).toBe(false);
    });
  });
});
