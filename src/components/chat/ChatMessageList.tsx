import React, { useEffect, useRef } from "react";
import { useChatStore } from "../../store/useChatStore";
import { ChatBubble } from "./ChatBubble";
import { SuggestionChips } from "./SuggestionChips";
import { Sparkles } from "lucide-react";

export const ChatMessageList: React.FC = () => {
  const messages = useChatStore((state) => state.messages);
  const isLoading = useChatStore((state) => state.isLoading);
  const error = useChatStore((state) => state.error);
  const sajuContext = useChatStore((state) => state.sajuContext);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!sajuContext) {
    return (
      <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/50 px-6 py-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-200">상담 정보를 준비하고 있습니다.</p>
          <p className="mt-2 text-xs text-zinc-400">
            로그인과 프로필 설정이 완료되면 자동으로 채팅을 시작할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/20 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
          <Sparkles size={32} className="text-purple-400" />
        </div>
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-zinc-100">명리학 기반 맞춤 상담</h2>
        <p className="mb-8 max-w-md font-medium leading-relaxed text-zinc-400">
          고민하고 계신 문제를 편하게 말씀해주시면
          나의 명식({sajuContext.palja.day.gan}
          {sajuContext.palja.day.ji} 일주)과 현재 운세를 바탕으로 사려 깊은 조언을 해드릴게요.
        </p>
        <div className="flex w-full max-w-lg flex-col justify-center gap-3 sm:flex-row">
          <div className="flex-1 cursor-default rounded-xl border border-zinc-700/50 bg-zinc-800/40 px-5 py-4 text-sm text-zinc-300 shadow-sm transition-colors hover:bg-zinc-800/60">
            "올해 이직해도 괜찮을까?"
          </div>
          <div className="flex-1 cursor-default rounded-xl border border-zinc-700/50 bg-zinc-800/40 px-5 py-4 text-sm text-zinc-300 shadow-sm transition-colors hover:bg-zinc-800/60">
            "요즘 인간관계가 너무 답답해"
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-smooth p-4 pb-0 sm:p-6">
      <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-end">
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;

          return (
            <React.Fragment key={message.id}>
              <ChatBubble message={message} />
              {isLastMessage && message.role === "assistant" && message.suggestions && (
                <SuggestionChips suggestions={message.suggestions} />
              )}
            </React.Fragment>
          );
        })}

        {isLoading && (
          <div className="animate-in fade-in slide-in-from-bottom-2 mb-6 flex w-full justify-start duration-300">
            <div className="mr-3 mt-1 flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-purple-500/20 bg-purple-600/20">
                <Sparkles size={16} className="animate-pulse text-purple-400" />
              </div>
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-zinc-700 bg-zinc-800/80 px-6 py-5 shadow-sm backdrop-blur-sm">
              <div className="flex h-full items-center gap-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: "150ms" }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-pink-400" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 flex justify-center">
            <div className="max-w-sm rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-center text-sm text-red-400 shadow-lg shadow-red-500/5 backdrop-blur-sm">
              {error}
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-6 shrink-0" />
      </div>
    </div>
  );
};
