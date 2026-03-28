import React, { useEffect, useMemo, useRef, useState } from "react";
import { History, LogOut, Plus, Timer, Trash2 } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { buildChatProfileKeyFromContext } from "@/lib/chatProfileKey";
import { usePaymentStore } from "@/store/usePaymentStore";

const formatUpdatedAt = (timestamp: number) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);

const formatRemainingTime = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

interface ChatSessionToolbarProps {
  showLogout?: boolean;
  onLogout?: () => void;
  isLogoutDisabled?: boolean;
}

export const ChatSessionToolbar: React.FC<ChatSessionToolbarProps> = ({
  showLogout = false,
  onLogout,
  isLogoutDisabled = false,
}) => {
  const activeOwnerKey = useChatStore((state) => state.activeOwnerKey);
  const sessions = useChatStore((state) => state.sessions);
  const currentSessionId = useChatStore((state) => state.currentSessionId);
  const isLoading = useChatStore((state) => state.isLoading);
  const sajuContext = useChatStore((state) => state.sajuContext);
  const startNewSession = useChatStore((state) => state.startNewSession);
  const switchSession = useChatStore((state) => state.switchSession);
  const deleteSession = useChatStore((state) => state.deleteSession);
  const nextFreeResetAt = usePaymentStore((state) => state.nextFreeResetAt);
  const refreshQuota = usePaymentStore((state) => state.refreshQuota);
  const [now, setNow] = useState(() => Date.now());
  const refreshTriggeredAtRef = useRef<string | null>(null);

  const activeProfileKey = sajuContext ? buildChatProfileKeyFromContext(sajuContext) : null;
  const visibleSessions = activeProfileKey && activeOwnerKey
    ? sessions.filter(
      (session) =>
        session.profileKey === activeProfileKey &&
        session.ownerKey === activeOwnerKey,
    )
    : [];
  const hasCurrentSession = Boolean(
    currentSessionId && visibleSessions.some((session) => session.id === currentSessionId),
  );
  const selectValue = hasCurrentSession ? (currentSessionId ?? "") : "";

  const nextFreeResetAtMs = useMemo(() => {
    if (!nextFreeResetAt) {
      return null;
    }
    const parsed = Date.parse(nextFreeResetAt);
    return Number.isFinite(parsed) ? parsed : null;
  }, [nextFreeResetAt]);

  const remainingMs = nextFreeResetAtMs !== null ? nextFreeResetAtMs - now : null;
  const shouldShowTimer = remainingMs !== null && remainingMs > 0;

  useEffect(() => {
    if (nextFreeResetAtMs === null) {
      return;
    }

    setNow(Date.now());
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [nextFreeResetAtMs]);

  useEffect(() => {
    if (nextFreeResetAtMs === null || !nextFreeResetAt) {
      refreshTriggeredAtRef.current = null;
      return;
    }
    if (now < nextFreeResetAtMs) {
      return;
    }
    if (refreshTriggeredAtRef.current === nextFreeResetAt) {
      return;
    }

    refreshTriggeredAtRef.current = nextFreeResetAt;
    void refreshQuota();
  }, [nextFreeResetAt, nextFreeResetAtMs, now, refreshQuota]);

  return (
    <div className="shrink-0 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/70">
      <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={startNewSession}
          disabled={isLoading || !activeProfileKey || !activeOwnerKey}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={16} />
          새 상담
        </button>

        <div className="relative flex-1">
          <History className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <select
            value={selectValue}
            onChange={(event) => {
              if (event.target.value) {
                switchSession(event.target.value);
              }
            }}
            disabled={isLoading || visibleSessions.length === 0}
            className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800/70 pl-9 pr-3 text-sm text-zinc-200 outline-none transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {!activeProfileKey || !activeOwnerKey ? (
              <option value="">프로필 입력 후 상담 기록이 표시됩니다</option>
            ) : null}
            {activeProfileKey && activeOwnerKey && visibleSessions.length === 0 ? (
              <option value="">보기 가능한 상담 기록 없음</option>
            ) : null}
            {visibleSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.title} · {formatUpdatedAt(session.updatedAt)}
              </option>
            ))}
          </select>
        </div>

        {shouldShowTimer ? (
          <div className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 text-xs font-semibold text-zinc-200">
            <Timer size={14} className="text-zinc-400" />
            <span>다음 무료 복구 {formatRemainingTime(remainingMs ?? 0)}</span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => currentSessionId && deleteSession(currentSessionId)}
          disabled={!hasCurrentSession || isLoading}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 size={16} />
          삭제
        </button>

        {showLogout ? (
          <button
            type="button"
            aria-label="chat-logout"
            onClick={() => {
              onLogout?.();
            }}
            disabled={isLogoutDisabled || !onLogout}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        ) : null}
      </div>
    </div>
  );
};
