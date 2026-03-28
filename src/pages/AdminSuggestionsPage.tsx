import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Trash2, Clock, CheckCircle, XCircle, Eye, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useSuggestionStore, type Suggestion } from "@/store/useSuggestionStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || "";

const STATUS_OPTIONS: { value: Suggestion["status"]; label: string; color: string }[] = [
  { value: "pending", label: "대기중", color: "bg-amber-100 text-amber-700" },
  { value: "reviewed", label: "검토중", color: "bg-blue-100 text-blue-700" },
  { value: "planned", label: "반영 예정", color: "bg-emerald-100 text-emerald-700" },
  { value: "rejected", label: "보류", color: "bg-gray-100 text-gray-500" },
];

const CATEGORY_LABELS: Record<string, string> = {
  saju: "사주·만세력",
  astrology: "점성학·별자리",
  love: "연애·궁합",
  general: "기타",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function AdminSuggestionsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const {
    suggestions,
    fetchSuggestions,
    updateSuggestionStatus,
    deleteSuggestion,
    isLoading,
  } = useSuggestionStore();

  const handlePinSubmit = () => {
    if (pinInput === ADMIN_PIN) {
      setAuthenticated(true);
      setPinError(false);
      fetchSuggestions();
    } else {
      setPinError(true);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchSuggestions();
    }
  }, [authenticated, fetchSuggestions]);

  const filtered =
    statusFilter === "all"
      ? suggestions
      : suggestions.filter((s) => s.status === statusFilter);

  const handleStatusChange = async (id: string, status: Suggestion["status"]) => {
    const note = adminNotes[id];
    const ok = await updateSuggestionStatus(id, status, note);
    if (ok) {
      toast.success("상태가 업데이트되었습니다.");
    } else {
      toast.error("업데이트에 실패했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("이 제안을 삭제하시겠습니까?")) return;
    const ok = await deleteSuggestion(id);
    if (ok) {
      toast.success("제안이 삭제되었습니다.");
    } else {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleSaveNote = async (id: string) => {
    const note = adminNotes[id] ?? "";
    const item = suggestions.find((s) => s.id === id);
    if (!item) return;
    const ok = await updateSuggestionStatus(id, item.status, note);
    if (ok) {
      toast.success("메모가 저장되었습니다.");
    } else {
      toast.error("메모 저장에 실패했습니다.");
    }
  };

  // PIN 인증 화면
  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[380px] rounded-[28px] border border-gray-100 bg-white p-8 shadow-lg"
        >
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900 mb-4">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-[20px] font-bold text-gray-900">관리자 인증</h1>
            <p className="text-[13px] text-gray-500 mt-1">관리자 비밀번호를 입력하세요</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
              placeholder="비밀번호"
              className={`w-full rounded-xl border px-4 py-3.5 text-[15px] text-gray-900 outline-none transition-all ${
                pinError
                  ? "border-red-300 bg-red-50/50 focus:ring-red-100"
                  : "border-gray-200 bg-gray-50/50 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              }`}
            />
            {pinError && (
              <p className="text-[13px] text-red-500 font-medium">비밀번호가 올바르지 않습니다.</p>
            )}
            <Button
              onClick={handlePinSubmit}
              className="w-full h-12 rounded-xl bg-gray-900 text-white font-bold text-[14px] hover:bg-gray-800"
            >
              확인
            </Button>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors">
              ← 홈으로 돌아가기
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // 관리자 대시보드
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-[960px] px-5 py-8 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-[22px] font-bold text-gray-900">제안 관리</h1>
              <p className="text-[13px] text-gray-500">
                총 {suggestions.length}건 · 대기 {suggestions.filter((s) => s.status === "pending").length}건
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            전체 ({suggestions.length})
          </button>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                statusFilter === opt.value
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {opt.label} ({suggestions.filter((s) => s.status === opt.value).length})
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && filtered.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-600" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[15px] text-gray-400">해당 상태의 제안이 없습니다.</p>
          </div>
        )}

        {/* List */}
        <div className="space-y-4">
          {filtered.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="rounded-[20px] border border-gray-100 bg-white p-6 shadow-sm"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[12px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </span>
                    <span className="text-[12px] text-gray-400">{formatDate(item.created_at)}</span>
                    {item.contact && (
                      <span className="text-[12px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                        📧 {item.contact}
                      </span>
                    )}
                  </div>
                  <h3 className="text-[16px] font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-[14px] text-gray-600 leading-relaxed">{item.description}</p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 transition-all"
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Status + Admin note */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-gray-500 whitespace-nowrap">상태:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleStatusChange(item.id, opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                          item.status === opt.value
                            ? opt.color + " ring-1 ring-offset-1 ring-current"
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex gap-2 items-end">
                  <input
                    type="text"
                    value={adminNotes[item.id] ?? item.admin_note ?? ""}
                    onChange={(e) =>
                      setAdminNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    placeholder="관리자 메모 입력..."
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-indigo-200 transition-all"
                  />
                  <Button
                    onClick={() => handleSaveNote(item.id)}
                    variant="outline"
                    className="h-9 rounded-xl text-[12px] font-semibold px-4"
                  >
                    저장
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
