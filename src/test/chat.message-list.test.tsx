import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

interface MockChatState {
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
    suggestions?: string[];
  }>;
  isLoading: boolean;
  error: string | null;
  sajuContext: any;
}

const mocks = vi.hoisted(() => ({
  chatState: {
    messages: [],
    isLoading: false,
    error: null,
    sajuContext: null,
  } as MockChatState,
}));

vi.mock("@/store/useChatStore", () => ({
  useChatStore: () => mocks.chatState,
}));

vi.mock("@/components/chat/ChatBubble", () => ({
  ChatBubble: ({ message }: { message: { content: string } }) => <div>{message.content}</div>,
}));

vi.mock("@/components/chat/SuggestionChips", () => ({
  SuggestionChips: () => <div>suggestions</div>,
}));

import { ChatMessageList } from "@/components/chat/ChatMessageList";

describe("ChatMessageList", () => {
  beforeEach(() => {
    mocks.chatState.messages = [];
    mocks.chatState.isLoading = false;
    mocks.chatState.error = null;
    mocks.chatState.sajuContext = null;
  });

  it("does not render manual chat profile form when saju context is missing", () => {
    render(<ChatMessageList />);

    expect(screen.getByText("상담 정보를 준비하고 있습니다.")).toBeInTheDocument();
    expect(screen.queryByText("AI 상담 정보 입력")).not.toBeInTheDocument();
  });

  it("renders chat intro when saju context exists and there are no messages", () => {
    mocks.chatState.sajuContext = {
      palja: {
        day: {
          gan: "갑",
          ji: "자",
        },
      },
    };

    render(<ChatMessageList />);

    expect(screen.getByText("명리학 기반 맞춤 상담")).toBeInTheDocument();
  });
});
