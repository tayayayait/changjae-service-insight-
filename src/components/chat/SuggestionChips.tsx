import React from "react";
import { useChatStore } from "@/store/useChatStore";

interface SuggestionChipsProps {
  suggestions: string[];
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions }) => {
  const addSuggestionAsMessage = useChatStore((state) => state.addSuggestionAsMessage);
  const isLoading = useChatStore((state) => state.isLoading);

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const handleSuggestionClick = async (suggestion: string) => {
    if (isLoading) {
      return;
    }
    await addSuggestionAsMessage(suggestion);
  };

  return (
    <div
      className="mt-2 mb-6 ml-11 flex w-full gap-2 overflow-x-auto pb-2 scrollbar-hide"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          disabled={isLoading}
          onClick={() => {
            void handleSuggestionClick(suggestion);
          }}
          className="shrink-0 whitespace-nowrap rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-300 transition-colors hover:border-purple-500/40 hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};
