import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { CompatibilityResult, FortuneResult, SajuResult } from "@/types/result";
import { LoveReportRecord } from "@/types/love";
import {
  deleteCompatibilityResult,
  deleteFortuneResult,
  deleteSajuResult,
  listSajuResults,
  listFortuneResults,
  listCompatibilityResults,
} from "@/lib/resultStore";
import { deleteLoveReport, listLoveReports } from "@/lib/loveReportStore";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import {
  User,
  LogOut,
  Sparkles,
  Heart,
  Star,
  Trash2,
  ExternalLink,
  ShieldCheck,
  UserCircle,
  Settings2,
  Calendar,
  Clock,
  Baby,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { normalizeTimeBlockId, TIME_BLOCKS } from "@/lib/timeBlocks";
import {
  DEFAULT_REGION_SELECTION,
  normalizeRegionSelection,
  REGION_SIDO_OPTIONS,
  type RegionSido,
} from "@/lib/koreanRegions";

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
    });
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export default function MyPage() {
  const { user, profile, refreshProfile } = useAuthStore();
  const userEmail = user?.email ?? null;
  const [isLoading, setIsLoading] = useState(true);
  const [sajuResults, setSajuResults] = useState<SajuResult[]>([]);
  const [compatibilityResults, setCompatibilityResults] = useState<CompatibilityResult[]>([]);
  const [fortuneResults, setFortuneResults] = useState<FortuneResult[]>([]);
  const [loveReports, setLoveReports] = useState<LoveReportRecord[]>([]);
  
  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [birthPrecision, setBirthPrecision] = useState<"exact" | "time-block" | "unknown">("unknown");
  const [exactTime, setExactTime] = useState("");
  const [selectedSido, setSelectedSido] = useState<RegionSido>(DEFAULT_REGION_SELECTION.sido);
  const [editForm, setEditForm] = useState({
    name: "",
    gender: "male",
    calendar_type: "solar",
    year: 1990,
    month: 1,
    day: 1,
    hour: null as number | null,
    minute: null as number | null,
    time_block: null as string | null,
    location: DEFAULT_REGION_SELECTION.sido,
  });

  const load = async () => {
    setIsLoading(true);

    const [sajuList, compatibilityList, fortuneList, loveList] = await Promise.all([
      listSajuResults(),
      listCompatibilityResults(),
      listFortuneResults(),
      listLoveReports(),
    ]);
    setSajuResults(sajuList);
    setCompatibilityResults(compatibilityList);
    setFortuneResults(fortuneList);
    setLoveReports(loveList);
    setIsLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (profile) {
      const normalizedProfileTimeBlock = normalizeTimeBlockId(profile.time_block);
      const normalizedLocation = normalizeRegionSelection(profile.location);
      setSelectedSido(normalizedLocation.sido);
      setEditForm({
        name: profile.name || "",
        gender: profile.gender || "male",
        calendar_type: profile.calendar_type || "solar",
        year: profile.year || 1990,
        month: profile.month || 1,
        day: profile.day || 1,
        hour: profile.hour,
        minute: profile.minute,
        time_block: normalizedProfileTimeBlock ?? profile.time_block,
        location: normalizedLocation.sido,
      });

      if (normalizedProfileTimeBlock) {
        setBirthPrecision("time-block");
      } else if (profile.hour !== null) {
        setBirthPrecision("exact");
        setExactTime(`${profile.hour.toString().padStart(2, '0')}:${(profile.minute ?? 0).toString().padStart(2, '0')}`);
      } else {
        setBirthPrecision("unknown");
      }
    }
  }, [profile]);

  const allResultsCount = sajuResults.length + compatibilityResults.length + fortuneResults.length + loveReports.length;

  const handleSidoChange = (value: string) => {
    const nextSido = value as RegionSido;
    setSelectedSido(nextSido);
    setEditForm((prev) => ({
      ...prev,
      location: nextSido,
    }));
  };




  const handleDeleteSaju = async (id?: string) => {
    if (!id) {
      return;
    }
    await deleteSajuResult(id);
    await load();
  };

  const handleDeleteCompatibility = async (id?: string) => {
    if (!id) {
      return;
    }
    await deleteCompatibilityResult(id);
    await load();
  };

  const handleDeleteFortune = async (id?: string) => {
    if (!id) {
      return;
    }
    await deleteFortuneResult(id);
    await load();
  };

  const handleDeleteLoveReport = async (id?: string) => {
    if (!id) {
      return;
    }
    await deleteLoveReport(id);
    await load();
  };

  const handleLogout = async () => {
    const { signOut } = useAuthStore.getState();
    await signOut();
    toast({ title: "로그아웃 완료" });
    await load();
  };

  const handleUpdateProfile = async () => {
    if (isSubmitting) return;

    let finalHour: number | null = null;
    let finalMinute: number | null = null;
    let finalTimeBlock: string | null = null;

    if (birthPrecision === "exact") {
      if (!exactTime) {
        toast({ title: "입력 오류", description: "정확한 태어난 시간을 입력해 주세요.", variant: "destructive" });
        return;
      }
      const [hourPart, minutePart] = exactTime.split(":");
      const parsedHour = Number(hourPart);
      const parsedMinute = Number(minutePart);
      const isInvalidTime =
        Number.isNaN(parsedHour) ||
        Number.isNaN(parsedMinute) ||
        parsedHour < 0 ||
        parsedHour > 23 ||
        parsedMinute < 0 ||
        parsedMinute > 59;
      if (isInvalidTime) {
        toast({ title: "입력 오류", description: "시간 형식이 올바르지 않습니다.", variant: "destructive" });
        return;
      }
      finalHour = parsedHour;
      finalMinute = parsedMinute;
    } else if (birthPrecision === "time-block") {
      const normalizedTimeBlock = normalizeTimeBlockId(editForm.time_block);
      const block = TIME_BLOCKS.find((b) => b.id === normalizedTimeBlock);
      if (!block) {
        toast({ title: "입력 오류", description: "시주(시간대)를 선택해 주세요.", variant: "destructive" });
        return;
      }
      finalHour = block.midHour;
      finalMinute = block.midMinute;
      finalTimeBlock = block.id;
    }

    try {
      setIsSubmitting(true);
      const authPayload = await withTimeout(
        supabase.auth.getUser(),
        10000,
        "로그인 정보를 확인하는 중 시간이 초과되었습니다. 다시 시도해 주세요.",
      );
      const user = authPayload.data.user;
      if (!user) {
        throw new Error("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.");
      }

      const { error } = await withTimeout(
        supabase.from("user_profiles").upsert({
          id: user.id,
          ...editForm,
          location: editForm.location.trim() || selectedSido,
          hour: finalHour,
          minute: finalMinute,
          time_block: finalTimeBlock,
          updated_at: new Date().toISOString(),
        }),
        15000,
        "프로필 저장 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.",
      );

      if (error) throw error;

      await withTimeout(
        refreshProfile(),
        10000,
        "저장 후 프로필 동기화가 지연되고 있습니다. 새로고침 후 다시 확인해 주세요.",
      );
      setIsEditing(false);
      toast({ title: "프로필이 수정되었습니다." });
    } catch (error) {
      console.error("Update profile failed:", error);
      toast({ title: "수정 실패", description: "정보 저장 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-4xl space-y-8 px-6 py-10">
        {/* Header & Account Compact */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <header className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">보관함</h1>
            <p className="text-sm text-muted-foreground">나의 소중한 운세 기록들을 한 곳에서 확인하세요.</p>
          </header>

          <div className="flex flex-wrap items-center gap-3">
            {/* Profile Info Card (Only for logged in users) */}
            {userEmail && profile && !isEditing && (
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/80 p-3 px-5 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Baby className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{profile.name || "이름 없음"}</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-primary/20 bg-primary/5 text-primary">
                      {profile.gender === "male" ? "남성" : "여성"}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {profile.year}.{profile.month}.{profile.day} ({profile.calendar_type === "solar" ? "양력" : "음력"})
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="ml-2 h-8 gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  정보 수정
                </Button>
              </div>
            )}

            {userEmail && !profile && !isEditing && (
              <div className="flex items-center gap-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-3 px-5 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary">사주 정보가 없습니다</span>
                  <span className="text-[10px] text-muted-foreground">정확한 풀이를 위해 정보를 입력해 주세요.</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="ml-2 h-8 gap-1.5 rounded-lg px-3 text-xs font-bold"
                >
                  정보 입력하기
                </Button>
              </div>
            )}

            {!isEditing && (
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/50 p-3 pl-4 backdrop-blur-sm">
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">계정 상태</span>
                  <div className="flex items-center gap-1.5">
                    {userEmail ? (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-sm font-semibold">{userEmail}</span>
                      </>
                    ) : (
                      <>
                        <UserCircle className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-sm font-semibold">게스트 모드</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="h-8 w-px bg-border mx-1" />
                {userEmail ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() => void handleLogout()}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button asChild size="sm" className="h-9 rounded-xl bg-primary px-4 text-white shadow-sm ring-offset-background transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Link to="/login">로그인</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="mx-auto max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[32px] border-border bg-card p-8 shadow-xl shadow-black/5">
              <header className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">내 정보 수정</h2>
                  <p className="text-sm text-muted-foreground">정확한 사주 풀이를 위해 정보를 확인해 주세요.</p>
                </div>
                <Button variant="ghost" className="rounded-xl h-10 px-4" onClick={() => setIsEditing(false)}>취소</Button>
              </header>

              <div className="space-y-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-foreground/80 pl-1">이름</label>
                    <Input 
                      value={editForm.name} 
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
                      placeholder="이름 (최대 6자)"
                      maxLength={6}
                      className="h-12 rounded-[16px] border-border/60 bg-muted/30 focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-foreground/80 pl-1">성별</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["male", "female"].map((g) => (
                        <button
                          key={g}
                          onClick={() => setEditForm({...editForm, gender: g as "male" | "female"})}
                          className={cn(
                            "h-12 rounded-[16px] border-2 font-bold transition-all",
                            editForm.gender === g 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/20"
                          )}
                        >
                          {g === "male" ? "남성" : "여성"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-foreground/80 pl-1">지역</label>
                  <div>
                    <Select value={selectedSido} onValueChange={handleSidoChange}>
                      <SelectTrigger className="h-12 rounded-[16px] border-border/60 bg-muted/30 transition-all font-medium">
                        <SelectValue placeholder="시/도 선택" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-[250px]">
                        {REGION_SIDO_OPTIONS.map((sido) => (
                          <SelectItem key={sido} value={sido}>
                            {sido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="pl-1 text-xs text-muted-foreground">시/도만 선택합니다.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground/80 pl-1">출생 정보</label>
                  <div className="grid grid-cols-3 gap-2 mb-2 p-1.5 rounded-[18px] bg-muted/30 border border-border/40">
                    {["solar", "lunar", "lunar-leap"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditForm({...editForm, calendar_type: c as "solar" | "lunar" | "lunar-leap"})}
                        className={cn(
                          "h-10 rounded-[12px] text-sm font-bold transition-all",
                          editForm.calendar_type === c ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:bg-white/50"
                        )}
                      >
                        {c === "solar" ? "양력" : c === "lunar" ? "음력" : "윤달"}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Select value={editForm.year.toString()} onValueChange={(v) => setEditForm({...editForm, year: parseInt(v)})}>
                        <SelectTrigger className="h-12 rounded-[16px] border-border/60 bg-muted/30 transition-all font-medium">
                          <SelectValue placeholder="년" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-[250px]">
                          {Array.from({length: 100}, (_, i) => new Date().getFullYear() - i).map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}년</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Select value={editForm.month.toString()} onValueChange={(v) => setEditForm({...editForm, month: parseInt(v)})}>
                        <SelectTrigger className="h-12 rounded-[16px] border-border/60 bg-muted/30 transition-all font-medium">
                          <SelectValue placeholder="월" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-[250px]">
                          {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                            <SelectItem key={m} value={m.toString()}>{m}월</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Select value={editForm.day.toString()} onValueChange={(v) => setEditForm({...editForm, day: parseInt(v)})}>
                        <SelectTrigger className="h-12 rounded-[16px] border-border/60 bg-muted/30 transition-all font-medium">
                          <SelectValue placeholder="일" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-[250px]">
                          {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                            <SelectItem key={d} value={d.toString()}>{d}일</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <label className="text-sm font-bold text-foreground/80 pl-1">태어난 시간</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "exact", label: "정확히 알아요", icon: "⏰" },
                        { id: "time-block", label: "대략 알아요", icon: "🌤️" },
                        { id: "unknown", label: "모르겠어요", icon: "❓" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setBirthPrecision(item.id as "exact" | "time-block" | "unknown");
                            if (item.id === "time-block" && !normalizeTimeBlockId(editForm.time_block)) {
                              setEditForm((prev) => ({ ...prev, time_block: TIME_BLOCKS[0].id }));
                            }
                          }}
                          className={cn(
                            "py-3 rounded-[12px] border-2 transition-all flex flex-col items-center gap-1",
                            birthPrecision === item.id ? "border-primary bg-primary/5" : "border-border/60 bg-white hover:border-border"
                          )}
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-[12px] font-bold">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {birthPrecision === "exact" && (
                      <Input
                        type="time"
                        value={exactTime}
                        onChange={(e) => setExactTime(e.target.value)}
                        className="h-12 w-full rounded-[14px] border-border/60 bg-muted/30 px-4 text-center focus:border-primary transition-all mt-2 font-medium"
                      />
                    )}

                    {birthPrecision === "time-block" && (
                      <Select 
                        value={normalizeTimeBlockId(editForm.time_block) || undefined} 
                        onValueChange={(v) => setEditForm({...editForm, time_block: v})}
                      >
                        <SelectTrigger className="h-12 w-full rounded-[14px] border-border/60 bg-muted/30 mt-2 font-medium">
                          <SelectValue placeholder="시간대 선택" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {TIME_BLOCKS.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.label} ({t.range})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/60">
                  <Button 
                    onClick={handleUpdateProfile} 
                    disabled={isSubmitting}
                    className="w-full h-14 rounded-[20px] text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                    정보 업데이트 완료
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="h-11 w-full justify-start gap-1 bg-muted/50 p-1 sm:w-auto">
                <TabsTrigger value="all" className="rounded-md px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">종합</TabsTrigger>
                <TabsTrigger value="saju" className="rounded-md px-4 data-[state=active]:bg-background">사주</TabsTrigger>
                <TabsTrigger value="love" className="rounded-md px-4 data-[state=active]:bg-background">연애</TabsTrigger>
                <TabsTrigger value="comp" className="rounded-md px-4 data-[state=active]:bg-background">궁합</TabsTrigger>
                <TabsTrigger value="fortune" className="rounded-md px-4 data-[state=active]:bg-background">운세</TabsTrigger>
              </TabsList>
              <span className="text-xs font-semibold text-muted-foreground">총 {allResultsCount}개 보관</span>
            </div>

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <SkeletonCard lines={4} />
                <SkeletonCard lines={4} />
              </div>
            ) : (
              <>
                <TabsContent value="all" className="mt-0 grid gap-4 sm:grid-cols-2">
                  <ResultSection items={sajuResults} type="saju" onDelete={handleDeleteSaju} />
                  <ResultSection items={loveReports} type="love" onDelete={handleDeleteLoveReport} />
                  <ResultSection items={compatibilityResults} type="compatibility" onDelete={handleDeleteCompatibility} />
                  <ResultSection items={fortuneResults} type="fortune" onDelete={handleDeleteFortune} />
                </TabsContent>

                <TabsContent value="saju" className="mt-0 grid gap-4 sm:grid-cols-2">
                  <ResultSection items={sajuResults} type="saju" onDelete={handleDeleteSaju} showEmpty={true} />
                </TabsContent>

                <TabsContent value="love" className="mt-0 grid gap-4 sm:grid-cols-2">
                  <ResultSection items={loveReports} type="love" onDelete={handleDeleteLoveReport} showEmpty={true} />
                </TabsContent>

                <TabsContent value="comp" className="mt-0 grid gap-4 sm:grid-cols-2">
                  <ResultSection items={compatibilityResults} type="compatibility" onDelete={handleDeleteCompatibility} showEmpty={true} />
                </TabsContent>

                <TabsContent value="fortune" className="mt-0 grid gap-4 sm:grid-cols-2">
                  <ResultSection items={fortuneResults} type="fortune" onDelete={handleDeleteFortune} showEmpty={true} />
                </TabsContent>
              </>
            )}
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}

interface ResultSectionProps {
  items: (SajuResult | CompatibilityResult | FortuneResult | LoveReportRecord)[];
  type: "saju" | "compatibility" | "fortune" | "love";
  onDelete: (id: string) => Promise<void>;
  showEmpty?: boolean;
}

function ResultSection({ items, type, onDelete, showEmpty = false }: ResultSectionProps) {
  if (items.length === 0) {
    if (!showEmpty) return null;
    return (
      <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
        저장된 기록이 없습니다.
      </div>
    );
  }

  const getIcon = () => {
    switch (type) {
      case "saju": return <Star className="h-4 w-4 text-amber-500" />;
      case "love": return <Heart className="h-4 w-4 text-pink-500" />;
      case "compatibility": return <Heart className="h-4 w-4 text-rose-500" />;
      case "fortune": return <Sparkles className="h-4 w-4 text-indigo-500" />;
    }
  };

  const getLabel = () => {
    switch (type) {
      case "saju": return "사주 리포트";
      case "love": return "연애 리포트";
      case "compatibility": return "궁합 리포트";
      case "fortune": return "개인 운세";
    }
  };

  const getActionUrl = (id: string) => {
    switch (type) {
      case "saju": return `/result/${id}`;
      case "love": return `/love/report/${id}`;
      // 다른 타입들은 현재 결과 상세가 구현되어 있지 않으므로 URL 구조에 따라 조정 필요
      default: return `/result/${id}`;
    }
  };

  const getSummary = (item: SajuResult | CompatibilityResult | FortuneResult | LoveReportRecord) => {
    if (type === "love") {
      return (item as LoveReportRecord).preview.summary;
    }
    return (item as SajuResult | CompatibilityResult | FortuneResult).summary;
  };

  const getScore = (item: SajuResult | CompatibilityResult | FortuneResult | LoveReportRecord) => {
    if (type === "love") {
      return (item as LoveReportRecord).scoreSet?.overall;
    }
    if ("score" in item && typeof item.score === "number") {
      return item.score;
    }
    return undefined;
  };

  return (
    <>
      {items.map((item) => (
        <Card key={item.id} className="group relative overflow-hidden rounded-2xl border-border bg-card p-5 transition-all hover:border-primary/20 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                {getIcon()}
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{getLabel()}</span>
                {getScore(item) ? (
                  <Badge variant="secondary" className="rounded-full bg-primary/5 text-primary text-[10px] h-4">
                    {getScore(item)}점
                  </Badge>
                ) : null}
              </div>
              <h3 className="line-clamp-2 text-sm font-semibold text-foreground leading-snug">
                {getSummary(item)}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {item.createdAt?.slice(0, 10).replace(/-/g, ". ") ?? "날짜 정보 없음"}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <div className="flex gap-1.5">
              {(type === "saju" || type === "love") && (
                <Button asChild size="sm" variant="ghost" className="h-8 gap-1 rounded-lg text-xs font-medium hover:bg-primary/5 hover:text-primary">
                  <Link to={getActionUrl(item.id)}>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
              onClick={() => void onDelete(item.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      ))}
    </>
  );
}
