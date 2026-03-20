import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getAstrologySynastry, getAstrologyAISynastry, SynastryRequest, SynastryResult } from "@/lib/astrologyClient";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import { AstrologyRequest } from "@/types/result";
import { AspectList } from "@/components/astrology/AspectList";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReactMarkdown from 'react-markdown';

export default function AstrologySynastryPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SynastryResult | null>(null);

  const [p1, setP1] = useState<AstrologyRequest>({
    name: "나",
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    lng: 126.9780,
    lat: 37.5665,
    tz_str: "Asia/Seoul",
  });

  const [p2, setP2] = useState<AstrologyRequest>({
    name: "상대방",
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    lng: 126.9780,
    lat: 37.5665,
    tz_str: "Asia/Seoul",
  });

  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);

  const handleAIGenerate = async () => {
    if (!result) return;
    try {
      setIsAILoading(true);
      const req = {
        p1_name: p1.name,
        p2_name: p2.name,
        score: result.data.score,
        positive_count: result.data.positiveCount,
        negative_count: result.data.negativeCount,
        aspects: result.aspects || []
      };
      const response = await getAstrologyAISynastry(req);
      setAiReport(response.report);
    } catch (error: any) {
      toast({
        title: "AI 분석 실패",
        description: error.message || "AI 해석을 가져오는 데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setIsLoading(true);
      const data = await getAstrologySynastry({ p1, p2 });
      setResult(data);
      setStep(2);
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message || "궁합 분석 중 문제가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderInputForm = (
    title: string, 
    data: AstrologyRequest, 
    setData: React.Dispatch<React.SetStateAction<AstrologyRequest>>
  ) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-pink-500 rounded-full"></span>
        {title}
      </h3>
      <div className="space-y-4">
        <div>
          <Label className="text-gray-500 mb-1 block text-sm">이름/애칭</Label>
          <Input 
            value={data.name} 
            onChange={e => setData({...data, name: e.target.value})} 
            className="h-12 bg-gray-50 border-none rounded-xl"
            placeholder="이름을 입력하세요"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-gray-500 mb-1 block text-sm">연도</Label>
            <Input type="number" value={data.year} onChange={e => setData({...data, year: parseInt(e.target.value)})} className="h-12 bg-gray-50 border-none rounded-xl text-center" />
          </div>
          <div>
            <Label className="text-gray-500 mb-1 block text-sm">월</Label>
            <Input type="number" value={data.month} onChange={e => setData({...data, month: parseInt(e.target.value)})} className="h-12 bg-gray-50 border-none rounded-xl text-center" />
          </div>
          <div>
            <Label className="text-gray-500 mb-1 block text-sm">일</Label>
            <Input type="number" value={data.day} onChange={e => setData({...data, day: parseInt(e.target.value)})} className="h-12 bg-gray-50 border-none rounded-xl text-center" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-gray-500 mb-1 block text-sm">시 (24시간)</Label>
            <Input type="number" value={data.hour} onChange={e => setData({...data, hour: parseInt(e.target.value)})} className="h-12 bg-gray-50 border-none rounded-xl text-center" />
          </div>
          <div>
            <Label className="text-gray-500 mb-1 block text-sm">분</Label>
            <Input type="number" value={data.minute} onChange={e => setData({...data, minute: parseInt(e.target.value)})} className="h-12 bg-gray-50 border-none rounded-xl text-center" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AnalysisPageShell
      title="별자리 궁합 (Synastry)"
      subtitle="두 사람의 우주적 연결고리와 상호작용을 분석합니다."
    >
      <div className="max-w-xl mx-auto pb-20">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {renderInputForm("나의 출생 정보", p1, setP1)}
              <div className="flex justify-center my-2 text-pink-300">
                <Heart className="w-8 h-8 fill-pink-500 text-pink-500" />
              </div>
              {renderInputForm("상대방 출생 정보", p2, setP2)}

              <Button 
                onClick={handleAnalyze} 
                disabled={isLoading}
                className="w-full h-14 text-lg font-bold rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    우주의 별빛을 읽는 중...
                  </>
                ) : (
                  "궁합 분석하기"
                )}
              </Button>
            </motion.div>
          )}

          {step === 2 && result && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-pink-50 to-indigo-50 rounded-[32px] p-8 text-center border border-white shadow-sm">
                <h2 className="text-2xl font-black text-gray-900 mb-2">궁합 점수: <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-500">{result.data.score}점</span></h2>
                <p className="text-gray-700 font-medium whitespace-pre-wrap">{result.data.summary}</p>
                
                <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-black/5">
                  <div className="text-center">
                    <span className="block text-2xl font-black text-green-500">{result.data.positiveCount}</span>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">조화로운 각도</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-2xl font-black text-rose-500">{result.data.negativeCount}</span>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">긴장 / 갈등 각도</span>
                  </div>
                </div>
              </div>

              {result.chartSvg && (
                <div className="bg-white rounded-[32px] p-6 sm:p-8 flex flex-col items-center justify-center border border-gray-100 shadow-sm mx-auto w-full mb-6">
                   <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                     <span className="w-1.5 h-5 bg-indigo-500 rounded-full"></span>
                     시나스트리 차트
                   </h3>
                   <div 
                      dangerouslySetInnerHTML={{ __html: result.chartSvg }} 
                      className="w-full max-w-md aspect-square [&>svg]:w-full [&>svg]:h-full"
                   />
                   <p className="text-xs text-gray-400 mt-4 text-center">안쪽 원: {p1.name} / 바깥쪽 원: {p2.name}</p>
                </div>
              )}

              {/* AI 심층 분석 섹션 */}
              {result && (
                <div className="bg-gradient-to-br from-indigo-50 to-pink-50 rounded-[32px] p-6 lg:p-8 border border-white shadow-sm overflow-hidden relative mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-indigo-500 fill-indigo-500" />
                    <h3 className="text-xl font-bold text-gray-900">AI 궁합 심층 리포트</h3>
                  </div>
                  
                  {aiReport ? (
                    <div className="prose prose-indigo max-w-none prose-p:text-gray-700 prose-headings:text-indigo-900 prose-strong:text-indigo-800 bg-white/60 p-6 rounded-2xl backdrop-blur-sm border border-white/50">
                      <ReactMarkdown>{aiReport}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-6 font-medium">두 사람의 운명적 만남, 관계의 잠재력, 그리고 극복해야 할 갈등을 AI가 심도 있게 분석해 드립니다.</p>
                      <Button 
                        onClick={handleAIGenerate} 
                        disabled={isAILoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-6 rounded-xl shadow-md shadow-indigo-200"
                      >
                        {isAILoading ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />관계성 스캔 중...</>
                        ) : (
                          <><Star className="w-4 h-4 mr-2" />나만의 심층 리포트 생성하기</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {result.aspects && <AspectList aspects={result.aspects} />}

              <Button onClick={() => setStep(1)} variant="outline" className="w-full h-14 rounded-2xl bg-white mt-8">다른 정보로 보기</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnalysisPageShell>
  );
}
