import { useState } from "react";
import {
  getPalmistryAnalysis,
  type PalmAnalyzeAuxiliaryInput,
  type PalmNailShape,
  type PalmThickness,
  type PalmistryResult,
} from "@/lib/astrologyClient";
import { useToast } from "@/hooks/use-toast";

type MainStep = "upload" | "thickness" | "nail" | "analyzing" | "result";

const THICKNESS_OPTIONS: ReadonlyArray<{ id: PalmThickness; imageSrc: string; label: string }> = [
  { id: "thin", imageSrc: "/images/palmistry/thin-palm.png", label: "얇은 손바닥" },
  { id: "normal", imageSrc: "/images/palmistry/normal-palm.png", label: "보통 손바닥" },
];

const NAIL_OPTIONS: ReadonlyArray<{ id: PalmNailShape; imageSrc: string; label: string }> = [
  { id: "round", imageSrc: "/images/palmistry/round-nails.svg", label: "둥근 손톱" },
  { id: "square", imageSrc: "/images/palmistry/square-nails.svg", label: "각진 손톱" },
];

export default function PalmistryPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<MainStep>("upload");
  const [imageData, setImageData] = useState<string | null>(null);
  const [palmThickness, setPalmThickness] = useState<PalmThickness | null>(null);
  const [nailShape, setNailShape] = useState<PalmNailShape | null>(null);
  const [result, setResult] = useState<PalmistryResult | null>(null);

  const handleImageUpload: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImageData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageData || !palmThickness || !nailShape) {
      return;
    }

    setStep("analyzing");
    try {
      const auxiliary: PalmAnalyzeAuxiliaryInput = {
        palmThickness,
        nailShape,
      };
      const response = await getPalmistryAnalysis(imageData, auxiliary);

      if (!response.success || !response.result) {
        throw new Error("손금 분석 응답이 비어 있습니다.");
      }

      setResult(response.result);
      setStep("result");
    } catch (error) {
      setStep("nail");
      toast({
        title: "분석 실패",
        description: error instanceof Error ? error.message : "손금 분석에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  if (step === "upload") {
    return (
      <section className="mx-auto max-w-2xl p-6" data-testid="palm-main-step-upload">
        <h1 className="mb-4 text-xl font-bold">손금 분석</h1>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <button
          type="button"
          data-testid="palm-main-next-auxiliary"
          className="mt-4 rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          disabled={!imageData}
          onClick={() => setStep("thickness")}
        >
          다음
        </button>
      </section>
    );
  }

  if (step === "thickness") {
    return (
      <section className="mx-auto max-w-2xl p-6" data-testid="palm-main-step-thickness">
        <h2 className="mb-4 text-lg font-semibold">손바닥 두께 선택</h2>
        <div className="grid grid-cols-2 gap-4">
          {THICKNESS_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`rounded-xl border p-2 ${palmThickness === option.id ? "border-black" : "border-gray-200"}`}
              onClick={() => setPalmThickness(option.id)}
            >
              <img src={option.imageSrc} alt={option.label} className="h-24 w-full rounded-md object-cover" />
            </button>
          ))}
        </div>
        <button
          type="button"
          data-testid="palm-main-next-nail"
          className="mt-4 rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          disabled={!palmThickness}
          onClick={() => setStep("nail")}
        >
          다음
        </button>
      </section>
    );
  }

  if (step === "nail") {
    return (
      <section className="mx-auto max-w-2xl p-6" data-testid="palm-main-step-nail">
        <h2 className="mb-4 text-lg font-semibold">손톱 모양 선택</h2>
        <div className="grid grid-cols-2 gap-4">
          {NAIL_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`rounded-xl border p-2 ${nailShape === option.id ? "border-black" : "border-gray-200"}`}
              onClick={() => setNailShape(option.id)}
            >
              <img src={option.imageSrc} alt={option.label} className="h-24 w-full rounded-md object-cover" />
            </button>
          ))}
        </div>
        <button
          type="button"
          data-testid="palm-main-analyze-start"
          className="mt-4 rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          disabled={!nailShape}
          onClick={() => void handleAnalyze()}
        >
          분석 시작
        </button>
      </section>
    );
  }

  if (step === "analyzing") {
    return (
      <section className="mx-auto max-w-2xl p-6" data-testid="palm-main-step-analyzing">
        <p className="text-sm text-gray-600">손금을 분석하고 있습니다...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl p-6" data-testid="palm-main-step-result">
      <h2 className="mb-4 text-lg font-semibold">분석 결과</h2>
      {result?.overlay ? (
        <svg data-testid="palm-overlay-svg" className="h-64 w-full rounded-xl border border-gray-200 bg-white" />
      ) : (
        <div data-testid="palm-overlay-fallback" className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          오버레이 데이터가 없어 텍스트 결과만 표시합니다.
        </div>
      )}
    </section>
  );
}
