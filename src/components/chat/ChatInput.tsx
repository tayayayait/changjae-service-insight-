import React, { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { usePaymentStore } from "@/store/usePaymentStore";
import { toast } from "@/hooks/use-toast";

const NO_CREDIT_MESSAGE = "남은 질문이 없습니다. 10회권 결제 후 질문을 이어갈 수 있습니다.";

export const ChatInput: React.FC = () => {
  const [text, setText] = useState("");
  const sendMessage = useChatStore((state) => state.sendMessage);
  const isLoading = useChatStore((state) => state.isLoading);
  const sajuContext = useChatStore((state) => state.sajuContext);
  const hasValidPass = usePaymentStore((state) => state.hasValidPass());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_LENGTH = 500;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!sajuContext) {
      return;
    }

    if (!hasValidPass) {
      toast({
        title: "질문 횟수 소진",
        description: NO_CREDIT_MESSAGE,
        variant: "destructive",
      });
      return;
    }

    const trimmed = text.trim();
    if (!trimmed || isLoading || text.length > MAX_LENGTH) {
      return;
    }

    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await sendMessage(trimmed, "input");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="relative border-t border-zinc-800 bg-zinc-900/95 p-4 pb-6 sm:pb-8">
      <form onSubmit={handleSubmit} className="relative mx-auto flex max-w-4xl items-end gap-3">
        <div className="relative flex-1 rounded-2xl border border-zinc-700/50 bg-zinc-800/50 transition-all focus-within:border-purple-500/50 focus-within:shadow-[0_0_10px_rgba(168,85,247,0.1)]">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={sajuContext ? "궁금한 점을 자유롭게 질문해보세요..." : "프로필 설정이 필요합니다."}
            className="max-h-[120px] min-h-[52px] w-full resize-none bg-transparent px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500 md:py-4"
            rows={1}
            disabled={isLoading || !sajuContext}
            maxLength={MAX_LENGTH}
          />
          <div className="absolute bottom-2 right-4 rounded bg-zinc-800/80 px-1 text-xs font-medium text-zinc-500">
            {text.length}/{MAX_LENGTH}
          </div>
        </div>

        <button
          type="submit"
          disabled={!text.trim() || isLoading || text.length > MAX_LENGTH || !sajuContext}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-14"
        >
          {isLoading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <Send size={24} className="relative left-[1px] top-[-1px]" />
          )}
        </button>
      </form>
      <div className="mx-auto mt-4 max-w-4xl text-center text-[11px] leading-relaxed text-zinc-500">
        AI 상담 결과는 참고용입니다. 중요한 결정은 전문가 상담과 함께 판단해 주세요.
      </div>
    </div>
  );
};
