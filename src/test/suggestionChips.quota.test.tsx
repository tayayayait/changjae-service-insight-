import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SuggestionChips } from "@/components/chat/SuggestionChips";
import { useChatStore } from "@/store/useChatStore";

const originalAddSuggestionAsMessage = useChatStore.getState().addSuggestionAsMessage;

describe("SuggestionChips", () => {
  beforeEach(() => {
    useChatStore.setState({
      addSuggestionAsMessage: originalAddSuggestionAsMessage,
      isLoading: false,
      error: null,
    });
  });

  it("routes suggestion click to chat store", async () => {
    const addSuggestionAsMessageMock = vi.fn(async (_suggestion: string) => {});
    useChatStore.setState({
      addSuggestionAsMessage: addSuggestionAsMessageMock,
      isLoading: false,
    });

    render(<SuggestionChips suggestions={["chip question"]} />);
    fireEvent.click(screen.getByRole("button", { name: "chip question" }));

    await waitFor(() => {
      expect(addSuggestionAsMessageMock).toHaveBeenCalledWith("chip question");
    });
  });

  it("does not send suggestion while loading", async () => {
    const addSuggestionAsMessageMock = vi.fn(async (_suggestion: string) => {});
    useChatStore.setState({
      addSuggestionAsMessage: addSuggestionAsMessageMock,
      isLoading: true,
    });

    render(<SuggestionChips suggestions={["blocked suggestion"]} />);
    fireEvent.click(screen.getByRole("button", { name: "blocked suggestion" }));

    await waitFor(() => {
      expect(addSuggestionAsMessageMock).not.toHaveBeenCalled();
    });
  });
});
