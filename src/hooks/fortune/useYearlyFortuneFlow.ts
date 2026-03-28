import { useEffect, useState } from "react";
import { SajuResult, YearlyFortuneResult } from "@/types/result";

export function useYearlyFortuneFlow() {
  const [baseResult] = useState<SajuResult | null>(null);
  const [yearly] = useState<YearlyFortuneResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    setIsLoading(false);
  }, [retryToken]);

  return {
    baseResult,
    yearly,
    isLoading,
    error,
    retryToken,
    setRetryToken,
  };
}
