import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb, MessageSquarePlus, Clock, CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useSuggestionStore, type Suggestion } from "@/store/useSuggestionStore";
import { SuggestionModal } from "@/components/suggestion/SuggestionModal";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG: Record<
  Suggestion["status"],
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "대기중",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  reviewed: {
    label: "검토중",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <Eye className="h-3.5 w-3.5" />,
  },
  planned: {
    label: "반영 예정",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  rejected: {
    label: "보류",
    color: "bg-gray-100 text-gray-500 border-gray-200",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  saju: "사주·만세력",
  astrology: "점성학·별자리",
  love: "연애·궁합",
  general: "기타",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}

const ITEMS_PER_PAGE = 15;

export default function SuggestionPage() {
  const { suggestions, fetchSuggestions, isLoading } = useSuggestionStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(suggestions.length / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * ITEMS_PER_PAGE;
  const pagedSuggestions = suggestions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const visiblePageCount = 5;
  const startPage = Math.max(1, currentPageSafe - Math.floor(visiblePageCount / 2));
  const endPage = Math.min(totalPages, startPage + visiblePageCount - 1);
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, idx) => startPage + idx);

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-7 md:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
            <Lightbulb className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-gray-900">서비스 제안함</h1>
            <p className="text-[12px] text-gray-500">원하는 서비스를 제안하고 진행 상태를 확인하세요</p>
          </div>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="h-10 rounded-xl bg-gray-900 px-4 text-[12px] font-bold text-white hover:bg-gray-800 shadow-sm"
        >
          <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" />
          새 제안
        </Button>
      </div>

      {/* Loading */}
      {isLoading && suggestions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-600" />
          <p className="mt-4 text-[14px] text-gray-500">불러오는 중...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && suggestions.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 mb-5">
            <Lightbulb className="h-10 w-10 text-indigo-300" />
          </div>
          <h3 className="text-[17px] font-bold text-gray-900 mb-2">아직 제안이 없습니다</h3>
          <p className="text-[14px] text-gray-500 mb-6 max-w-sm">
            원하시는 서비스나 기능이 있다면 자유롭게 제안해 주세요. 운영자가 검토 후 반영합니다.
          </p>
          <Button
            onClick={() => setModalOpen(true)}
            className="h-11 rounded-xl bg-indigo-600 px-6 text-[13px] font-bold text-white hover:bg-indigo-700"
          >
            첫 제안 작성하기
          </Button>
        </motion.div>
      )}

      {/* Suggestion list */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          {pagedSuggestions.map((item, idx) => {
            const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${statusCfg.color}`}
                      >
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </div>
                    <h3 className="mb-1 truncate text-[14px] font-bold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="line-clamp-2 text-[12px] leading-relaxed text-gray-600">
                      {item.description}
                    </p>

                    {item.admin_note && (
                      <div className="mt-2.5 rounded-lg border border-indigo-100 bg-indigo-50/60 p-2.5">
                        <p className="text-[12px] font-semibold text-indigo-600 mb-1">운영자 답변</p>
                        <p className="text-[12px] leading-relaxed text-gray-700">{item.admin_note}</p>
                      </div>
                    )}
                  </div>
                  <span className="mt-1 whitespace-nowrap text-[11px] text-gray-400">
                    {formatDate(item.created_at)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {suggestions.length > 0 && totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPageSafe === 1}
            aria-label="이전 페이지"
            className="h-8 px-2.5"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          {pageNumbers.map((page) => (
            <Button
              key={page}
              type="button"
              size="sm"
              variant={page === currentPageSafe ? "default" : "outline"}
              onClick={() => setCurrentPage(page)}
              aria-label={`${page}페이지`}
              className="h-8 min-w-8 px-2 text-[12px]"
            >
              {page}
            </Button>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPageSafe === totalPages}
            aria-label="다음 페이지"
            className="h-8 px-2.5"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <SuggestionModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
