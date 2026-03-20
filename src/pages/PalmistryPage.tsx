import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Hand, Loader2, Lock, MessageCircleQuestion, ScanFace, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import { InteractionCard } from "@/components/common/InteractionCard";
import { InsightCard } from "@/components/common/InsightCard";
import { askPalmistryQuestion, getPalmistryAnalysis, PalmistryResult } from "@/lib/astrologyClient";
import {
  buildPalmQaContext,
  buildPalmSectionReports,
  PALM_SECTION_IDS,
  resolvePalmModeAndSection,
  type PalmQaScope,
} from "@/lib/palmistryReport";
import { useAuthStore } from "@/store/useAuthStore";

const LINE_METRICS = [
  { key: "life_length", label: "Life Line" },
  { key: "head_length", label: "Head Line" },
  { key: "heart_length", label: "Heart Line" },
] as const;

const SAMPLE_QUESTIONS = [
  "지금 결과에서 제가 가장 먼저 고쳐야 할 행동 패턴은 뭔가요?",
  "재물/커리어 관점에서 이번 달 핵심 체크포인트를 알려주세요.",
  "관계에서 리스크를 줄이려면 어떤 대화 방식이 좋을까요?",
] as const;

const SECTION_LABEL: Record<(typeof PALM_SECTION_IDS)[number], string> = {
  personality: "성향",
  "wealth-career": "재물/커리어",
  relationship: "관계",
  timing: "변화시기",
};

const PalmistryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [qaLoading, setQaLoading] = useState(false);
  const [result, setResult] = useState<PalmistryResult | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isPremium = useAuthStore((state) => state.isPremium);

  const { mode, section } = useMemo(
    () => resolvePalmModeAndSection(searchParams.get("mode"), searchParams.get("section")),
    [searchParams],
  );

  useEffect(() => {
    const currentMode = searchParams.get("mode");
    const currentSection = searchParams.get("section");
    const isModeChanged = currentMode !== mode;
    const isSectionChanged = mode === "main" ? currentSection !== section : currentSection !== null;
    if (!isModeChanged && !isSectionChanged) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("mode", mode);
    if (mode === "main") {
      nextParams.set("section", section);
    } else {
      nextParams.delete("section");
    }
    setSearchParams(nextParams, { replace: true });
  }, [mode, section, searchParams, setSearchParams]);

  const sectionReports = useMemo(() => (result ? buildPalmSectionReports(result) : []), [result]);
  const activeSectionReport = sectionReports.find((item) => item.id === section) ?? sectionReports[0];
  const qualityScore = result?.quality ? Math.round(result.quality.overall * 100) : null;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const onAnalyze = async () => {
    if (!image) {
      return;
    }

    setLoading(true);
    try {
      const data = await getPalmistryAnalysis(image);
      if (!data.success) {
        throw new Error("손금 분석 요청에 실패했습니다.");
      }

      setResult(data.result);
      setAnswer(null);
      setQuestion("");
      toast({
        title: "분석 완료",
        description: mode === "face" ? "관상/손금 분석 결과를 불러왔습니다." : "손금 4섹션 리포트를 불러왔습니다.",
      });
    } catch (error: unknown) {
      toast({
        title: "오류 발생",
        description: error instanceof Error ? error.message : "손금 분석 호출에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onAskQuestion = async () => {
    if (!result) {
      return;
    }

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      toast({
        title: "질문 입력 필요",
        description: "AI에게 물어볼 질문을 입력해 주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!activeSectionReport) {
      return;
    }

    const scope: PalmQaScope = isPremium ? "detailed" : "summary";
    const qaContext = buildPalmQaContext(result, activeSectionReport, scope);

    setQaLoading(true);
    try {
      const data = await askPalmistryQuestion(trimmedQuestion, qaContext, scope);
      if (!data.success || !data.answer) {
        throw new Error("AI 답변 생성에 실패했습니다.");
      }
      setAnswer(data.answer);
    } catch (error: unknown) {
      toast({
        title: "질문 처리 실패",
        description: error instanceof Error ? error.message : "AI 질의응답 호출에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setQaLoading(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setImage(null);
    setQuestion("");
    setAnswer(null);
  };

  const handleSectionChange = (sectionId: (typeof PALM_SECTION_IDS)[number]) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("mode", "main");
    nextParams.set("section", sectionId);
    setSearchParams(nextParams, { replace: true });
    setAnswer(null);
  };

  return (
    <AnalysisPageShell
      categoryId="palmistry"
      title={mode === "face" ? "AI 관상 스캐너" : "AI 손금 메인 리포트"}
      subtitle={
        mode === "face"
          ? "현재 관상 탭은 기존 분석 흐름을 유지합니다."
          : "한 번의 스캔으로 성향·재물/커리어·관계·변화시기 4섹션을 확인합니다."
      }
      icon={mode === "face" ? ScanFace : Hand}
      themeColor="accent-pink"
    >
      <div className="grid gap-6">
        {!result ? (
          <InteractionCard
            title={mode === "face" ? "얼굴 또는 손바닥 사진 업로드" : "손바닥 사진 업로드"}
            description="선명한 이미지를 업로드해 주세요."
            step={1}
            totalSteps={2}
          >
            <div
              className="mt-4 cursor-pointer rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center transition-colors hover:border-pink-300"
              onClick={() => fileInputRef.current?.click()}
            >
              {image ? (
                <div className="relative">
                  <img src={image} alt="Uploaded" className="mx-auto max-h-64 rounded-lg shadow-sm" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="rounded-2xl bg-pink-100/50 p-4 text-pink-500">
                    <Camera className="h-10 w-10" />
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="h-12 w-full rounded-xl">
                {image ? "다른 사진 선택" : "사진 선택하기"}
              </Button>
              {image && (
                <Button onClick={onAnalyze} disabled={loading} className="h-12 w-full rounded-xl bg-[#24303F] text-white">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 분석 중...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> 분석 시작
                    </>
                  )}
                </Button>
              )}
            </div>
          </InteractionCard>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-700">
            <InsightCard
              label="기본 요약"
              title={result.classification?.palm_type || "분석 결과"}
              content={<div className="text-[15px] leading-relaxed">{result.interpretation}</div>}
              variant="highlight"
            />

            {result.quality && (
              <div className="analysis-card !p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Scan quality</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  Score {qualityScore} / 100 · Hand {result.handedness ?? "unknown"}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Blur {Math.round(result.quality.blur_score * 100)} · Exposure {Math.round(result.quality.exposure_score * 100)}
                </p>
                {result.quality.reasons.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-600">
                    {result.quality.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              {LINE_METRICS.map((line) => (
                <div key={line.key} className="analysis-card text-center !p-4">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-text-secondary">{line.label}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {Math.round(Number(result.features?.[line.key] ?? 0))}
                    <span className="ml-0.5 text-[10px] font-normal text-gray-400">px</span>
                  </p>
                </div>
              ))}
            </div>

            {mode === "main" && activeSectionReport && (
              <>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {PALM_SECTION_IDS.map((sectionId) => {
                    const isActive = activeSectionReport.id === sectionId;
                    return (
                      <Button
                        key={sectionId}
                        variant={isActive ? "default" : "outline"}
                        className="h-10 rounded-xl"
                        onClick={() => handleSectionChange(sectionId)}
                      >
                        {SECTION_LABEL[sectionId]}
                      </Button>
                    );
                  })}
                </div>

                <InsightCard
                  label={`${activeSectionReport.label} 요약`}
                  title="무료 요약"
                  content={<div className="text-[15px] leading-relaxed">{activeSectionReport.summary}</div>}
                />

                {isPremium ? (
                  <InsightCard
                    label={`${activeSectionReport.label} 상세`}
                    title="프리미엄 상세 리포트"
                    content={
                      <ul className="list-disc space-y-2 pl-5 text-[14px] leading-relaxed">
                        {activeSectionReport.details.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    }
                  />
                ) : (
                  <InteractionCard title="상세 리포트 잠금" description="무료 계정은 요약만 확인할 수 있습니다." step={2} totalSteps={2}>
                    <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm font-semibold text-gray-900">
                        <Lock className="mr-1 inline h-4 w-4" />
                        프리미엄에서 열리는 항목
                      </p>
                      <p className="mt-2 text-sm text-gray-600">{activeSectionReport.details[0]}</p>
                      <p className="mt-1 text-sm text-gray-600">상세 해석 3개 항목 + 변화시기 심화 해석 + 상세형 Q&A</p>
                    </div>
                  </InteractionCard>
                )}
              </>
            )}

            <InteractionCard title="AI에게 질문하기" description="현재 섹션 기준으로 궁금한 점을 물어보세요." step={2} totalSteps={2}>
              <div className="mt-4 space-y-3">
                {!isPremium && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-900">
                    무료 계정은 요약 범위 질문만 제공됩니다. 상세형 질문은 프리미엄에서 이용 가능합니다.
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_QUESTIONS.map((sampleQuestion) => (
                    <Button key={sampleQuestion} type="button" variant="outline" size="sm" onClick={() => setQuestion(sampleQuestion)}>
                      {sampleQuestion}
                    </Button>
                  ))}
                </div>

                <Textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="예: 현재 섹션 기준으로 제가 당장 바꿔야 할 행동 1가지는?"
                  rows={4}
                />

                <Button
                  onClick={onAskQuestion}
                  disabled={qaLoading || !question.trim()}
                  className="h-11 w-full rounded-xl bg-[#24303F] text-white"
                >
                  {qaLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 답변 생성 중...
                    </>
                  ) : (
                    <>
                      <MessageCircleQuestion className="mr-2 h-4 w-4" /> AI에게 질문하기
                    </>
                  )}
                </Button>
              </div>
            </InteractionCard>

            {answer && (
              <InsightCard
                label="AI 답변"
                title={isPremium ? "상세 질문 응답" : "요약 질문 응답"}
                content={<div className="text-[15px] leading-relaxed whitespace-pre-wrap">{answer}</div>}
              />
            )}

            <div className="flex justify-center pt-6">
              <Button onClick={resetAnalysis} variant="outline" className="rounded-xl px-6">
                다시 분석하기
              </Button>
            </div>
          </div>
        )}
      </div>
    </AnalysisPageShell>
  );
};

export default PalmistryPage;
