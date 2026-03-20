import React, { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserInterest } from "@/types/result";

interface InterestOption {
  value: UserInterest;
  label: string;
  emoji?: string;
}

const INTEREST_OPTIONS: InterestOption[] = [
  { value: "career", label: "취업/이직", emoji: "💼" },
  { value: "love", label: "연애/결혼" },
  { value: "study", label: "시험/학업", emoji: "📚" },
  { value: "money", label: "재물/재테크", emoji: "💰" },
  { value: "health", label: "건강", emoji: "🍀" },
  { value: "kids", label: "자녀/가족", emoji: "👨‍👩‍👧" },
  { value: "path", label: "진로/적성", emoji: "🧭" },
  { value: "rel", label: "대인관계", emoji: "🤝" },
  { value: "realestate", label: "부동산", emoji: "🏡" },
  { value: "travel", label: "여행/이사", emoji: "✈️" },
  { value: "business", label: "사업/창업", emoji: "📈" },
  { value: "self", label: "자기계발", emoji: "🧠" },
];

interface InterestSelectorProps {
  selectedInterests: UserInterest[];
  onChange: (interests: UserInterest[], freeQuestion: string) => void;
  className?: string;
}

export function InterestSelector({ selectedInterests, onChange, className }: InterestSelectorProps) {
  const [localQuestion, setLocalQuestion] = useState("");

  const handleToggle = (value: UserInterest) => {
    const next = selectedInterests.includes(value)
      ? selectedInterests.filter((item) => item !== value)
      : [...selectedInterests, value];

    onChange(next, localQuestion);
  };

  const handleQuestionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLocalQuestion(value);
    onChange(selectedInterests, value);
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="text-center">
        <h3 className="text-h3 text-foreground">원하는 분석 주제를 선택해주세요</h3>
        <p className="mt-2 text-caption text-text-secondary">복수 선택 가능. 선택한 주제 중심으로 분석 카드가 구성됩니다.</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {INTEREST_OPTIONS.map((option) => {
          const isSelected = selectedInterests.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              className={cn(
                "flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-normal",
                isSelected
                  ? "border-2 border-[#24303F] bg-accent-pink/35 text-foreground"
                  : "border border-border bg-bg-elevated text-text-secondary hover:border-line-strong",
              )}
            >
              {option.emoji ? <span>{option.emoji}</span> : null}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-label text-foreground">또는 자유 질문을 입력하세요</p>
        <div className="relative">
          <input
            type="text"
            value={localQuestion}
            onChange={handleQuestionChange}
            placeholder="예: 올해 이직 시점이 궁금해요"
            className="h-12 w-full rounded-md border border-border bg-bg-elevated pl-4 pr-11 text-[14px] focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Search className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-text-muted" />
        </div>
      </div>
    </div>
  );
}
