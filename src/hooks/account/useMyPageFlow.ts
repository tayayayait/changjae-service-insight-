import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteCompatibilityResult,
  deleteFortuneResult,
  deleteSajuResult,
  listCompatibilityResults,
  listFortuneResults,
  listSajuResults,
} from "@/lib/resultStore";
import { deleteLoveReport, listLoveReports } from "@/lib/loveReportStore";
import { deleteAstrologyReport, listAstrologyReports } from "@/lib/astrologyStore";
import { CompatibilityResult, FortuneResult, SajuResult } from "@/types/result";
import { LoveReportRecord } from "@/types/love";
import { AstrologyReportRecord } from "@/types/astrology";

export function useMyPageFlow() {
  const [isLoading, setIsLoading] = useState(true);
  const [sajuResults, setSajuResults] = useState<SajuResult[]>([]);
  const [compatibilityResults, setCompatibilityResults] = useState<CompatibilityResult[]>([]);
  const [fortuneResults, setFortuneResults] = useState<FortuneResult[]>([]);
  const [loveReports, setLoveReports] = useState<LoveReportRecord[]>([]);
  const [astrologyReports, setAstrologyReports] = useState<AstrologyReportRecord[]>([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sajuList, compatibilityList, fortuneList, loveList, astrologyList] =
        await Promise.all([
          listSajuResults(),
          listCompatibilityResults(),
          listFortuneResults(),
          listLoveReports(),
          listAstrologyReports(),
        ]);
      setSajuResults(sajuList);
      setCompatibilityResults(compatibilityList);
      setFortuneResults(fortuneList);
      setLoveReports(loveList);
      setAstrologyReports(astrologyList);
    } catch (error) {
      console.error("Failed to load results:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const allResultsCount = useMemo(
    () =>
      sajuResults.length +
      compatibilityResults.length +
      fortuneResults.length +
      loveReports.length +
      astrologyReports.length,
    [
      astrologyReports.length,
      compatibilityResults.length,
      fortuneResults.length,
      loveReports.length,
      sajuResults.length,
    ],
  );

  const handleDeleteSaju = useCallback(
    async (id?: string) => {
      if (!id) return;
      await deleteSajuResult(id);
      await load();
    },
    [load],
  );

  const handleDeleteCompatibility = useCallback(
    async (id?: string) => {
      if (!id) return;
      await deleteCompatibilityResult(id);
      await load();
    },
    [load],
  );

  const handleDeleteFortune = useCallback(
    async (id?: string) => {
      if (!id) return;
      await deleteFortuneResult(id);
      await load();
    },
    [load],
  );

  const handleDeleteLoveReport = useCallback(
    async (id?: string) => {
      if (!id) return;
      await deleteLoveReport(id);
      await load();
    },
    [load],
  );

  const handleDeleteAstrology = useCallback(
    async (id?: string) => {
      if (!id) return;
      await deleteAstrologyReport(id);
      await load();
    },
    [load],
  );

  return {
    isLoading,
    sajuResults,
    compatibilityResults,
    fortuneResults,
    loveReports,
    astrologyReports,
    allResultsCount,
    handleDeleteSaju,
    handleDeleteCompatibility,
    handleDeleteFortune,
    handleDeleteLoveReport,
    handleDeleteAstrology,
  };
}
