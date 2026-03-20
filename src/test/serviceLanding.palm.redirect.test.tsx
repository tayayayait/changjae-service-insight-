import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import ServiceLandingPage from "@/pages/ServiceLandingPage";

function PalmistryProbe() {
  const location = useLocation();
  return <div data-testid="palmistry-location">{`${location.pathname}${location.search}`}</div>;
}

describe("ServiceLandingPage palm redirect", () => {
  it("redirects palm-destiny-change to canonical timing section", async () => {
    render(
      <MemoryRouter initialEntries={["/service/palm-destiny-change"]}>
        <Routes>
          <Route path="/service/:serviceId" element={<ServiceLandingPage />} />
          <Route path="/palmistry" element={<PalmistryProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("palmistry-location")).toHaveTextContent("/palmistry?mode=main&section=timing");
    });
  });

  it("keeps legacy palm-history alias compatible with timing redirect", async () => {
    render(
      <MemoryRouter initialEntries={["/service/palm-history"]}>
        <Routes>
          <Route path="/service/:serviceId" element={<ServiceLandingPage />} />
          <Route path="/palmistry" element={<PalmistryProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("palmistry-location")).toHaveTextContent("/palmistry?mode=main&section=timing");
    });
  });
});
