import { create } from "zustand";
import { ChatMessage, SajuChatContext } from "../types/result";
import { sendChatMessage } from "../lib/geminiClient";
import { buildChatProfileKeyFromContext } from "@/lib/chatProfileKey";
import { getDefaultOwnerKey } from "@/lib/ownerIdentity";
import { usePaymentStore } from "./usePaymentStore";

const CHAT_SESSIONS_STORAGE_KEY = "saju:chat:sessions:v3";
const DEFAULT_CHAT_SESSION_TITLE = "새 대화";
const MAX_CHAT_SESSIONS = 30;
const MAX_CHAT_MESSAGES = 120;
const NO_CREDITS_ERROR_CODE = "NO_CREDITS";
const NO_CONTEXT_ERROR = "사주 프로필이 설정되지 않았습니다.";
const UNKNOWN_ERROR = "알 수 없는 오류가 발생했습니다.";

export interface ChatSession {
  id: string;
  title: string;
  ownerKey: string;
  profileKey: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

interface PersistedChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
}

interface ActiveSessionScope {
  ownerKey: string;
  profileKey: string;
}

interface ChatState {
  activeOwnerKey: string | null;
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sajuContext: SajuChatContext | null;
  setActiveOwnerKey: (ownerKey: string | null) => void;
  setSajuContext: (ctx: SajuChatContext | null) => void;
  startNewSession: () => void;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  sendMessage: (text: string, usageSource?: "input" | "suggestion") => Promise<void>;
  addSuggestionAsMessage: (suggestion: string) => Promise<void>;
  clearChat: () => void;
  resetAllSessions: () => void;
}

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

const normalizeOwnerKey = (ownerKey: string | null) => {
  const normalized = ownerKey?.trim();
  return normalized ? normalized : null;
};

const buildProfileKey = (ctx: SajuChatContext) => buildChatProfileKeyFromContext(ctx);
const getActiveProfileKey = (ctx: SajuChatContext | null) => (ctx ? buildProfileKey(ctx) : null);

const getActiveScope = (params: {
  ownerKey: string | null;
  sajuContext: SajuChatContext | null;
}): ActiveSessionScope | null => {
  const ownerKey = normalizeOwnerKey(params.ownerKey);
  const profileKey = getActiveProfileKey(params.sajuContext);
  if (!ownerKey || !profileKey) {
    return null;
  }
  return { ownerKey, profileKey };
};

const isSessionInScope = (session: ChatSession, scope: ActiveSessionScope | null) =>
  Boolean(
    scope &&
      session.ownerKey === scope.ownerKey &&
      session.profileKey === scope.profileKey,
  );

const findLatestSessionIdForScope = (
  sessions: ChatSession[],
  scope: ActiveSessionScope | null,
) => {
  if (!scope) {
    return null;
  }
  return (
    sessions.find(
      (session) =>
        session.ownerKey === scope.ownerKey &&
        session.profileKey === scope.profileKey,
    )?.id ?? null
  );
};

const buildSessionTitle = (text: string) => {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) {
    return DEFAULT_CHAT_SESSION_TITLE;
  }
  return compact.length > 24 ? `${compact.slice(0, 24)}...` : compact;
};

const normalizeSessionTitle = (session: ChatSession) => {
  const firstUserMessage = session.messages.find((message) => message.role === "user");
  if (!firstUserMessage) {
    return DEFAULT_CHAT_SESSION_TITLE;
  }

  const compact = session.title.replace(/\s+/g, " ").trim();
  if (!compact) {
    return buildSessionTitle(firstUserMessage.content);
  }

  return compact;
};

const trimMessages = (messages: ChatMessage[]) => messages.slice(-MAX_CHAT_MESSAGES);

const sortAndCapSessions = (sessions: ChatSession[]) =>
  [...sessions]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CHAT_SESSIONS);

const createSession = (scope: ActiveSessionScope): ChatSession => {
  const now = Date.now();
  return {
    id: generateId(),
    title: DEFAULT_CHAT_SESSION_TITLE,
    ownerKey: scope.ownerKey,
    profileKey: scope.profileKey,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
};

const isStorageAvailable = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const readPersistedState = (): PersistedChatState => {
  if (!isStorageAvailable()) {
    return { sessions: [], currentSessionId: null };
  }

  try {
    const raw = window.localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
    if (!raw) {
      return { sessions: [], currentSessionId: null };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedChatState>;
    const sessions = Array.isArray(parsed.sessions)
      ? parsed.sessions.filter(
          (session) =>
            session &&
            typeof session.id === "string" &&
            typeof session.title === "string" &&
            typeof session.ownerKey === "string" &&
            typeof session.profileKey === "string" &&
            typeof session.createdAt === "number" &&
            typeof session.updatedAt === "number" &&
            Array.isArray(session.messages),
        ).map((session) => ({
          ...session,
          title: normalizeSessionTitle(session),
        }))
      : [];
    const nextSessions = sortAndCapSessions(sessions);
    const nextCurrentSessionId =
      typeof parsed.currentSessionId === "string" &&
      nextSessions.some((session) => session.id === parsed.currentSessionId)
        ? parsed.currentSessionId
        : nextSessions[0]?.id ?? null;

    return {
      sessions: nextSessions,
      currentSessionId: nextCurrentSessionId,
    };
  } catch {
    return { sessions: [], currentSessionId: null };
  }
};

const writePersistedState = (state: PersistedChatState) => {
  if (!isStorageAvailable()) {
    return;
  }

  window.localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(state));
};

const initialPersistedState = readPersistedState();

const withUpdatedSession = (
  sessions: ChatSession[],
  sessionId: string,
  updater: (session: ChatSession) => ChatSession,
) => sessions.map((session) => (session.id === sessionId ? updater(session) : session));

type CommitExtraState = Partial<
  Pick<ChatState, "sajuContext" | "isLoading" | "error" | "activeOwnerKey">
>;

export const useChatStore = create<ChatState>((set, get) => {
  const commitSessions = (
    sessions: ChatSession[],
    currentSessionId: string | null,
    extra: CommitExtraState = {},
    activeScopeOverride?: ActiveSessionScope | null,
  ) => {
    const nextSessions = sortAndCapSessions(sessions);
    const activeScope =
      activeScopeOverride ??
      getActiveScope({
        ownerKey: extra.activeOwnerKey ?? get().activeOwnerKey,
        sajuContext: extra.sajuContext ?? get().sajuContext,
      });
    const hasScopedCurrentSession = Boolean(
      currentSessionId &&
        nextSessions.some(
          (session) =>
            session.id === currentSessionId && isSessionInScope(session, activeScope),
        ),
    );
    const nextCurrentSessionId = hasScopedCurrentSession
      ? currentSessionId
      : findLatestSessionIdForScope(nextSessions, activeScope);
    const currentSession = nextCurrentSessionId
      ? nextSessions.find((session) => session.id === nextCurrentSessionId) ?? null
      : null;

    writePersistedState({
      sessions: nextSessions,
      currentSessionId: nextCurrentSessionId,
    });

    return {
      sessions: nextSessions,
      currentSessionId: nextCurrentSessionId,
      messages: currentSession?.messages ?? [],
      ...extra,
    };
  };

  return {
    activeOwnerKey: getDefaultOwnerKey(),
    sessions: initialPersistedState.sessions,
    currentSessionId: null,
    messages: [],
    isLoading: false,
    error: null,
    sajuContext: null,

    setActiveOwnerKey: (ownerKey) => {
      const normalizedOwnerKey = normalizeOwnerKey(ownerKey) ?? getDefaultOwnerKey();
      set((state) => {
        const activeScope = getActiveScope({
          ownerKey: normalizedOwnerKey,
          sajuContext: state.sajuContext,
        });
        return {
          ...commitSessions(state.sessions, state.currentSessionId, {
            activeOwnerKey: normalizedOwnerKey,
            error: null,
          }, activeScope),
        };
      });
    },

    setSajuContext: (ctx) => {
      if (!ctx) {
        set({ sajuContext: null, currentSessionId: null, messages: [], error: null });
        return;
      }

      set((state) => {
        const activeScope = getActiveScope({
          ownerKey: state.activeOwnerKey,
          sajuContext: ctx,
        });
        if (!activeScope) {
          return {
            sajuContext: ctx,
            currentSessionId: null,
            messages: [],
            error: null,
          };
        }

        const currentSession = state.currentSessionId
          ? state.sessions.find((session) => session.id === state.currentSessionId)
          : null;

        if (currentSession && isSessionInScope(currentSession, activeScope)) {
          return {
            sajuContext: ctx,
            messages: currentSession.messages,
            error: null,
          };
        }

        const matchedSession = state.sessions.find((session) =>
          isSessionInScope(session, activeScope),
        );
        if (matchedSession) {
          return {
            ...commitSessions(
              state.sessions,
              matchedSession.id,
              {
                sajuContext: ctx,
                error: null,
              },
              activeScope,
            ),
          };
        }

        const newSession = createSession(activeScope);
        return {
          ...commitSessions(
            [newSession, ...state.sessions],
            newSession.id,
            {
              sajuContext: ctx,
              error: null,
            },
            activeScope,
          ),
        };
      });
    },

    startNewSession: () => {
      const state = get();
      const activeScope = getActiveScope({
        ownerKey: state.activeOwnerKey,
        sajuContext: state.sajuContext,
      });
      if (!activeScope || !state.sajuContext) {
        set({ error: NO_CONTEXT_ERROR });
        return;
      }

      const newSession = createSession(activeScope);
      set((currentState) => ({
        ...commitSessions(
          [newSession, ...currentState.sessions],
          newSession.id,
          {
            sajuContext: state.sajuContext,
            error: null,
          },
          activeScope,
        ),
      }));
    },

    switchSession: (sessionId) => {
      set((state) => {
        const activeScope = getActiveScope({
          ownerKey: state.activeOwnerKey,
          sajuContext: state.sajuContext,
        });
        if (!activeScope) {
          return state;
        }

        if (
          !state.sessions.some(
            (session) =>
              session.id === sessionId && isSessionInScope(session, activeScope),
          )
        ) {
          return state;
        }

        return {
          ...commitSessions(
            state.sessions,
            sessionId,
            {
              error: null,
            },
            activeScope,
          ),
        };
      });
    },

    deleteSession: (sessionId) => {
      set((state) => {
        const activeScope = getActiveScope({
          ownerKey: state.activeOwnerKey,
          sajuContext: state.sajuContext,
        });
        if (!activeScope) {
          return state;
        }

        if (
          !state.sessions.some(
            (session) =>
              session.id === sessionId && isSessionInScope(session, activeScope),
          )
        ) {
          return state;
        }

        let nextSessions = state.sessions.filter((session) => session.id !== sessionId);
        const hasScopedCurrent = state.currentSessionId
          ? nextSessions.some(
              (session) =>
                session.id === state.currentSessionId &&
                isSessionInScope(session, activeScope),
            )
          : false;
        let nextCurrentId = hasScopedCurrent
          ? state.currentSessionId
          : findLatestSessionIdForScope(nextSessions, activeScope);

        if (!nextCurrentId && state.sajuContext) {
          const replacement = createSession(activeScope);
          nextSessions = [replacement, ...nextSessions];
          nextCurrentId = replacement.id;
        }

        return {
          ...commitSessions(
            nextSessions,
            nextCurrentId,
            {
              error: null,
            },
            activeScope,
          ),
        };
      });
    },

    sendMessage: async (text, usageSource = "input") => {
      const state = get();
      const { sajuContext } = state;
      const activeScope = getActiveScope({
        ownerKey: state.activeOwnerKey,
        sajuContext,
      });
      if (!sajuContext || !activeScope) {
        set({ error: NO_CONTEXT_ERROR });
        return;
      }

      const trimmedText = text.trim();
      if (!trimmedText) {
        return;
      }

      let sessions = state.sessions;
      let activeSession = state.currentSessionId
        ? sessions.find((session) => session.id === state.currentSessionId) ?? null
        : null;

      if (!activeSession || !isSessionInScope(activeSession, activeScope)) {
        activeSession =
          sessions.find((session) => isSessionInScope(session, activeScope)) ?? null;
      }

      if (!activeSession) {
        activeSession = createSession(activeScope);
        sessions = [activeSession, ...sessions];
      }

      const historyMessages = activeSession.messages;
      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: trimmedText,
        timestamp: Date.now(),
      };
      const usageId = generateId();
      const hasUserMessage = historyMessages.some((message) => message.role === "user");
      const nextTitle = hasUserMessage
        ? activeSession.title
        : buildSessionTitle(trimmedText);
      const messagesWithUser = trimMessages([...historyMessages, userMessage]);
      const sessionsWithUser = withUpdatedSession(
        sessions,
        activeSession.id,
        (session) => ({
          ...session,
          title: nextTitle,
          updatedAt: userMessage.timestamp,
          messages: messagesWithUser,
        }),
      );

      set(() => ({
        ...commitSessions(
          sessionsWithUser,
          activeSession.id,
          {
            sajuContext,
            isLoading: true,
            error: null,
          },
          activeScope,
        ),
      }));

      try {
        const response = await sendChatMessage({
          message: trimmedText,
          conversationHistory: historyMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          sajuContext,
          ownerKey: activeScope.ownerKey,
          profileKey: activeScope.profileKey,
          usageId,
          usageSource,
        });
        const paymentState = usePaymentStore.getState();
        if (response.quota) {
          paymentState.setQuotaFromChatResponse(response.quota);
        } else {
          paymentState.consumeQuotaFallback();
        }

        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: response.reply,
          timestamp: Date.now(),
          tags: response.tags,
          suggestions: response.followUpSuggestions,
        };

        set((current) => {
          const currentSessionId = current.currentSessionId ?? activeSession.id;
          const targetSession = current.sessions.find(
            (session) => session.id === currentSessionId,
          );
          if (!targetSession || !isSessionInScope(targetSession, activeScope)) {
            return {
              isLoading: false,
              error: null,
            };
          }

          const nextMessages = trimMessages([
            ...targetSession.messages,
            assistantMessage,
          ]);
          const nextSessions = withUpdatedSession(
            current.sessions,
            currentSessionId,
            (session) => ({
              ...session,
              updatedAt: assistantMessage.timestamp,
              messages: nextMessages,
            }),
          );

          return {
            ...commitSessions(
              nextSessions,
              currentSessionId,
              {
                isLoading: false,
                error: null,
              },
              activeScope,
            ),
          };
        });
      } catch (err) {
        const knownError = err as Error & { code?: string };
        if (knownError?.code === NO_CREDITS_ERROR_CODE) {
          set((current) => {
            const currentSessionId = current.currentSessionId ?? activeSession.id;
            const targetSession = current.sessions.find(
              (session) => session.id === currentSessionId,
            );
            if (!targetSession || !isSessionInScope(targetSession, activeScope)) {
              return {
                isLoading: false,
                error: knownError.message,
              };
            }

            const nextMessages = targetSession.messages.filter(
              (message) => message.id !== userMessage.id,
            );
            const nextSessions = withUpdatedSession(
              current.sessions,
              currentSessionId,
              (session) => ({
                ...session,
                messages: nextMessages,
                updatedAt: Date.now(),
              }),
            );

            return {
              ...commitSessions(
                nextSessions,
                currentSessionId,
                {
                  isLoading: false,
                  error: knownError.message,
                },
                activeScope,
              ),
            };
          });
          void usePaymentStore.getState().refreshQuota();
          return;
        }

        set({
          error: err instanceof Error ? err.message : UNKNOWN_ERROR,
          isLoading: false,
        });
      }
    },

    addSuggestionAsMessage: async (suggestion) => {
      const { messages, currentSessionId, sessions, sendMessage } = get();

      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "assistant" && lastMessage.suggestions) {
          const updatedMessages = [...messages];
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            suggestions: undefined,
          };

          if (currentSessionId) {
            const nextSessions = withUpdatedSession(
              sessions,
              currentSessionId,
              (session) => ({
                ...session,
                messages: updatedMessages,
                updatedAt: Date.now(),
              }),
            );
            set((state) => {
              const activeScope = getActiveScope({
                ownerKey: state.activeOwnerKey,
                sajuContext: state.sajuContext,
              });
              return {
                ...commitSessions(
                  nextSessions,
                  currentSessionId,
                  {
                    sajuContext: state.sajuContext,
                    isLoading: state.isLoading,
                    error: state.error,
                  },
                  activeScope,
                ),
              };
            });
          } else {
            set({ messages: updatedMessages });
          }
        }
      }

      await sendMessage(suggestion, "suggestion");
    },

    clearChat: () => {
      set((state) => {
        const activeScope = getActiveScope({
          ownerKey: state.activeOwnerKey,
          sajuContext: state.sajuContext,
        });
        if (!state.currentSessionId || !activeScope) {
          return {
            messages: [],
            currentSessionId: null,
            error: null,
          };
        }

        if (
          !state.sessions.some(
            (session) =>
              session.id === state.currentSessionId &&
              isSessionInScope(session, activeScope),
          )
        ) {
          return {
            ...commitSessions(
              state.sessions,
              null,
              {
                error: null,
              },
              activeScope,
            ),
          };
        }

        const nextSessions = withUpdatedSession(
          state.sessions,
          state.currentSessionId,
          (session) => ({
            ...session,
            title: DEFAULT_CHAT_SESSION_TITLE,
            updatedAt: Date.now(),
            messages: [],
          }),
        );
        return {
          ...commitSessions(
            nextSessions,
            state.currentSessionId,
            {
              error: null,
            },
            activeScope,
          ),
        };
      });
    },

    resetAllSessions: () => {
      const preservedOwnerKey = normalizeOwnerKey(get().activeOwnerKey) ?? getDefaultOwnerKey();
      writePersistedState({ sessions: [], currentSessionId: null });
      set({
        activeOwnerKey: preservedOwnerKey,
        sessions: [],
        currentSessionId: null,
        messages: [],
        isLoading: false,
        error: null,
        sajuContext: null,
      });
    },
  };
});


