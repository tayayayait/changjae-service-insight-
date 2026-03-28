import { useState, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  Clock, 
  Sparkles, 
  User, 
  Calendar,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useConsultStore } from "@/store/useConsultStore";
import { Gender, UserBirthData } from "@/types/result";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AstrologyInputProps {
  onComplete: (snapshot: Partial<UserBirthData> & { name?: string }) => void;
  isAnalyzing?: boolean;
}

// 17개 시/도 전체 정식 명칭 및 좌표 데이터
const CITIES = [
  { name: "서울특별시", lat: 37.5665, lng: 126.978, tz: "Asia/Seoul" },
  { name: "인천광역시", lat: 37.4563, lng: 126.7052, tz: "Asia/Seoul" },
  { name: "대전광역시", lat: 36.3504, lng: 127.3845, tz: "Asia/Seoul" },
  { name: "대구광역시", lat: 35.8714, lng: 128.6014, tz: "Asia/Seoul" },
  { name: "부산광역시", lat: 35.1796, lng: 129.0756, tz: "Asia/Seoul" },
  { name: "울산광역시", lat: 35.5384, lng: 129.3114, tz: "Asia/Seoul" },
  { name: "광주광역시", lat: 35.1595, lng: 126.8526, tz: "Asia/Seoul" },
  { name: "세종특별자치시", lat: 36.4801, lng: 127.2890, tz: "Asia/Seoul" },
  { name: "경기도", lat: 37.2636, lng: 127.0286, tz: "Asia/Seoul" },
  { name: "강원특별자치도", lat: 37.8813, lng: 127.7298, tz: "Asia/Seoul" },
  { name: "충청북도", lat: 36.6358, lng: 127.4912, tz: "Asia/Seoul" },
  { name: "충청남도", lat: 36.6013, lng: 126.6608, tz: "Asia/Seoul" },
  { name: "경상북도", lat: 36.5684, lng: 128.7294, tz: "Asia/Seoul" },
  { name: "경상남도", lat: 35.2277, lng: 128.6811, tz: "Asia/Seoul" },
  { name: "전북특별자치도", lat: 35.8242, lng: 127.1480, tz: "Asia/Seoul" },
  { name: "전라남도", lat: 34.8164, lng: 126.4629, tz: "Asia/Seoul" },
  { name: "제주특별자치도", lat: 33.4996, lng: 126.5312, tz: "Asia/Seoul" },
];

export const AstrologyInput = memo(({ onComplete, isAnalyzing }: AstrologyInputProps) => {
  const { userProfile, updateProfile } = useConsultStore();
  const [name, setName] = useState(userProfile.name || "");
  const [month, setMonth] = useState<string>(userProfile.month ? String(userProfile.month) : "");
  const [day, setDay] = useState<string>(userProfile.day ? String(userProfile.day) : "");
  const [year, setYear] = useState<string>(userProfile.year ? String(userProfile.year) : "");
  const [gender, setGender] = useState<Gender | null>(userProfile.gender || null);
  const [hour, setHour] = useState<string>(userProfile.hour !== undefined ? String(userProfile.hour) : "");
  const [minute, setMinute] = useState<string>(userProfile.minute !== undefined ? String(userProfile.minute) : "");
  const [birthTimeKnown, setBirthTimeKnown] = useState(userProfile.hour !== undefined);
  const [place, setPlace] = useState(userProfile.location || "서울특별시");
  
  const currentCity = useMemo(() => CITIES.find(c => c.name === place), [place]);

  const isFormValid = 
    name.trim() !== "" && 
    month !== "" && 
    day !== "" && 
    year !== "" && 
    gender !== null && 
    place.trim() !== "" &&
    (!birthTimeKnown || (hour !== "" && minute !== ""));

  const handleSubmit = () => {
    if (!isFormValid) return;

    const nextProfile = {
      name,
      month: Number(month),
      day: Number(day),
      year: Number(year),
      gender: gender!,
      hour: birthTimeKnown ? Number(hour) : undefined,
      minute: birthTimeKnown ? Number(minute) : undefined,
      location: place,
      lat: currentCity?.lat,
      lng: currentCity?.lng,
      timezone: currentCity?.tz || "Asia/Seoul",
    } satisfies Partial<UserBirthData> & { name?: string };

    updateProfile(nextProfile);
    onComplete(nextProfile);
  };

  return (
    <>
      <div className="w-full max-w-2xl mx-auto px-4 py-6">
      <Card className="p-6 md:p-10 rounded-[28px] md:rounded-[40px] border border-white/40 shadow-2xl shadow-indigo-500/10 bg-white/25 md:bg-white/35 backdrop-blur-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-60" />
        
        <header className="mb-8 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">코스믹 프로필 정보</h2>
            <p className="text-[13px] font-bold text-gray-500/80">나의 별자리 정보를 한 번에 입력해 보세요.</p>
          </div>
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-200/20 shadow-inner">
            <Sparkles className="h-6 w-6" />
          </div>
        </header>

        <div className="space-y-10">
          {/* Section 1: 기본 정보 */}
          <section className="space-y-5">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4 opacity-70" /> 기본 정보
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 ml-1">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="본명 또는 닉네임"
                  className="w-full h-14 rounded-2xl border-2 border-white/20 bg-white/10 px-5 text-lg font-bold text-gray-800 placeholder:text-gray-400 focus:border-indigo-400/50 focus:bg-white/20 outline-none transition-all backdrop-blur-md"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 ml-1">성별</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setGender("male")}
                    className={cn(
                      "h-14 rounded-2xl border-2 font-black transition-all backdrop-blur-md",
                      gender === "male" 
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                        : "border-white/20 bg-white/10 text-gray-500 hover:bg-white/20 hover:border-white/30"
                    )}
                  >
                    남성
                  </button>
                  <button
                    onClick={() => setGender("female")}
                    className={cn(
                      "h-14 rounded-2xl border-2 font-black transition-all backdrop-blur-md",
                      gender === "female" 
                        ? "border-rose-500 bg-rose-600 text-white shadow-lg shadow-rose-500/20" 
                        : "border-white/20 bg-white/10 text-gray-500 hover:bg-white/20 hover:border-white/30"
                    )}
                  >
                    여성
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: 생년월일 */}
          <section className="space-y-5">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-4 h-4 opacity-70" /> 출생 일시
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 ml-1">연도</label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 border-white/20 bg-white/10 px-4 text-lg font-bold text-gray-800 focus:border-indigo-400/50 focus:bg-white/20 outline-none backdrop-blur-md">
                    <SelectValue placeholder="년" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 rounded-2xl border-white/20 bg-white/90 backdrop-blur-xl">
                    {Array.from({ length: 100 }, (_, i) => {
                      const y = new Date().getFullYear() - i;
                      return <SelectItem key={y} value={String(y)} className="font-bold">{y}년</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 ml-1">월</label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="h-14 w-full rounded-2xl border-2 border-white/20 bg-white/10 px-4 text-lg font-bold text-gray-800 focus:border-indigo-400/50 focus:bg-white/20 outline-none backdrop-blur-md">
                    <SelectValue placeholder="월" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-white/20 bg-white/90 backdrop-blur-xl">
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)} className="font-bold">{i + 1}월</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 ml-1">일</label>
                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger className="h-14 w-full rounded-2xl border-2 border-white/20 bg-white/10 px-4 text-lg font-bold text-gray-800 focus:border-indigo-400/50 focus:bg-white/20 outline-none backdrop-blur-md">
                    <SelectValue placeholder="일" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 rounded-2xl border-white/20 bg-white/90 backdrop-blur-xl">
                    {Array.from({ length: 31 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)} className="font-bold">{i + 1}일</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-3 px-1">
                <label className="text-xs font-black text-gray-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> 태어난 시간
                </label>
                <button
                  onClick={() => setBirthTimeKnown(!birthTimeKnown)}
                  className={cn(
                    "text-[10px] font-black px-3 py-1.5 rounded-full transition-all border shadow-sm backdrop-blur-md",
                    birthTimeKnown ? "bg-white/5 text-gray-500 border-white/10" : "bg-indigo-500/10 text-indigo-600 border-indigo-200/20"
                  )}
                >
                  {birthTimeKnown ? "시간 모름" : "상세 시간 입력"}
                </button>
              </div>
              
              <AnimatePresence mode="wait">
                {birthTimeKnown ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <Select value={hour} onValueChange={setHour}>
                      <SelectTrigger className="w-full h-14 rounded-2xl border-2 border-white/20 bg-white/10 px-4 text-lg font-bold text-gray-800 focus:border-indigo-400/50 focus:bg-white/20 outline-none backdrop-blur-md">
                        <SelectValue placeholder="시" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80 rounded-2xl border-white/20 bg-white/90 backdrop-blur-xl">
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)} className="font-bold">{i}시</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={minute} onValueChange={setMinute}>
                      <SelectTrigger className="w-full h-14 rounded-2xl border-2 border-white/20 bg-white/10 px-4 text-lg font-bold text-gray-800 focus:border-indigo-400/50 focus:bg-white/20 outline-none backdrop-blur-md">
                        <SelectValue placeholder="분" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80 rounded-2xl border-white/20 bg-white/90 backdrop-blur-xl">
                        {Array.from({ length: 60 }, (_, i) => (
                          <SelectItem key={i} value={String(i)} className="font-bold">{String(i).padStart(2, '0')}분</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-2xl bg-amber-500/10 border border-amber-200/20 text-[12px] font-bold text-amber-800/80 leading-relaxed backdrop-blur-md"
                  >
                    시간을 모를 경우 정오(12:00)를 기준으로 분석하며, 정확도가 일부 제한될 수 있습니다.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Section 3: 태어난 장소 */}
          <section className="space-y-5">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-4 h-4 opacity-70" /> 태어난 장소
            </h3>
            
            <div className="space-y-4">
              <Select value={place} onValueChange={setPlace}>
                <SelectTrigger className="h-14 w-full rounded-2xl border-2 border-white/20 bg-white/10 px-5 text-lg font-bold text-gray-800 focus:border-indigo-400/50 focus:bg-white/20 outline-none backdrop-blur-md">
                  <SelectValue placeholder="지역 선택" />
                </SelectTrigger>
                <SelectContent className="max-h-80 rounded-2xl border-white/20 bg-white/90 backdrop-blur-xl">
                  {CITIES.map((city) => (
                    <SelectItem key={city.name} value={city.name} className="font-bold">{city.name}</SelectItem>
                  ))}
                  <SelectItem value="overseas" className="font-bold text-blue-600">해외 직접 입력</SelectItem>
                </SelectContent>
              </Select>

              {place === "overseas" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="relative"
                >
                  <input
                    type="text"
                    placeholder="도시명을 직접 입력하세요 (예: 런던, 뉴욕)"
                    className="w-full h-14 rounded-2xl border-2 border-white/10 bg-white/5 px-5 text-sm font-bold text-gray-800 focus:border-indigo-400/50 focus:bg-white/10 outline-none backdrop-blur-md"
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        setPlace(e.target.value.trim());
                      }
                    }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-600 bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-200/10 backdrop-blur-md">직접 입력</span>
                </motion.div>
              )}

              {place !== "overseas" && !CITIES.find(c => c.name === place) && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-500/10 border border-indigo-200/20 backdrop-blur-md">
                  <span className="text-sm font-bold text-indigo-700">{place}</span>
                  <button 
                    onClick={() => setPlace("서울특별시")}
                    className="text-[11px] font-black text-indigo-600 underline"
                  >
                    다시 선택
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="mt-12">
          <Button
            onClick={handleSubmit}
            disabled={isAnalyzing || !isFormValid}
            className={cn(
              "h-18 w-full rounded-[24px] text-xl font-black shadow-2xl transition-all active:scale-[0.98] backdrop-blur-xl",
              isFormValid 
                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20" 
                : "bg-white/5 text-gray-400 border border-white/10"
            )}
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                성계도 분석 중...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                리포트 확인하기
                <ChevronRight className="w-6 h-6" />
              </div>
            )}
          </Button>
          
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400/80">
              <Sparkles className="w-3 h-3 text-indigo-400 opacity-60" /> 개인정보는 분석 즉시 안전하게 처리됩니다.
            </div>
          </div>
        </footer>
      </Card>
      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400/60">
          <Sparkles className="w-3 h-3 text-indigo-400/40" /> 모든 데이터는 암호화되어 안전하게 보호됩니다.
        </div>
        <p className="text-[10px] text-gray-400/50 font-medium text-center leading-relaxed">
          Powered by Kerykeion Astro Engine<br />
          © 2026 Cosmic Insights. All rights reserved.
        </p>
      </div>
    </div>
  </>
);
});
