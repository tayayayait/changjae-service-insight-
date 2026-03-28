import { useEffect } from "react";
import { useConsultStore } from "@/store/useConsultStore";
import { PAID_CHAT_OPEN, usePaymentStore } from "@/store/usePaymentStore";
import { useChatStore } from "@/store/useChatStore";
import { buildChatProfileKeyFromContext } from "@/lib/chatProfileKey";
import { buildOwnerKeyFromUserId } from "@/lib/ownerIdentity";
import { useAuthStore } from "@/store/useAuthStore";
import { calculateSaju } from "@/lib/sajuEngine";
import { normalizeTimeBlockId } from "@/lib/timeBlocks";
import type {
  BirthPrecision,
  CalendarType,
  Gender,
  SajuChatContext,
  UserBirthData,
} from "@/types/result";


const hasCompleteBirthProfile = (profile: {
  gender?: "male" | "female";
  calendar_type?: "solar" | "lunar" | "lunar-leap";
  year?: number;
  month?: number;
  day?: number;
}) =>
  (profile.gender === "male" || profile.gender === "female") &&
  (profile.calendar_type === "solar" ||
    profile.calendar_type === "lunar" ||
    profile.calendar_type === "lunar-leap") &&
  typeof profile.year === "number" &&
  typeof profile.month === "number" &&
  typeof profile.day === "number";

const resolveBirthPrecision = (profile: {
  hour?: number | null;
  minute?: number | null;
  time_block?: string | null;
}): BirthPrecision => {
  if (typeof profile.hour === "number" && typeof profile.minute === "number") {
    return "exact";
  }
  if (normalizeTimeBlockId(profile.time_block)) {
    return "time-block";
  }
  return "unknown";
};

const buildChatContextFromAuthProfile = (
  profile: {
    name?: string;
    gender?: "male" | "female";
    calendar_type?: "solar" | "lunar" | "lunar-leap";
    year?: number;
    month?: number;
    day?: number;
    hour?: number | null;
    minute?: number | null;
    time_block?: string | null;
    location?: string;
    lat?: number;
    lng?: number;
    timezone?: string;
  } | null,
): SajuChatContext | null => {
  if (!profile || !hasCompleteBirthProfile(profile)) {
    return null;
  }

  const birthPrecision = resolveBirthPrecision(profile);
  const normalizedTimeBlock = normalizeTimeBlockId(profile.time_block);
  const birthData: UserBirthData = {
    name: profile.name?.trim() || undefined,
    gender: profile.gender as Gender,
    calendarType: profile.calendar_type as CalendarType,
    year: profile.year as number,
    month: profile.month as number,
    day: profile.day as number,
    birthPrecision,
    hour: birthPrecision === "exact" ? (profile.hour as number) : undefined,
    minute: birthPrecision === "exact" ? (profile.minute as number) : undefined,
    timeBlock: birthPrecision === "time-block" ? normalizedTimeBlock ?? undefined : undefined,
    location: profile.location ?? undefined,
    lat: typeof profile.lat === "number" ? profile.lat : undefined,
    lng: typeof profile.lng === "number" ? profile.lng : undefined,
    timezone: profile.timezone ?? undefined,
  };

  const convertedSaju = calculateSaju(birthData);
  return {
    name: birthData.name,
    palja: convertedSaju.palja,
    oheng: convertedSaju.oheng,
    yongsin: convertedSaju.yongsin,
    sinsal: convertedSaju.sinsal,
    profileMeta: {
      name: birthData.name,
      calendarType: birthData.calendarType,
      birthYear: birthData.year,
      birthMonth: birthData.month,
      birthDay: birthData.day,
      gender: birthData.gender,
      birthPrecision,
      timeBlock: birthData.timeBlock,
      hour: birthData.hour,
      minute: birthData.minute,
    },
    currentYear: new Date().getFullYear(),
  };
};

export function useChatAccess() {
  const setService = useConsultStore((state) => state.setService);
  const sajuContext = useChatStore((state) => state.sajuContext);
  const setSajuContext = useChatStore((state) => state.setSajuContext);
  const authUser = useAuthStore((state) => state.user);
  const authProfile = useAuthStore((state) => state.profile);
  const authOwnerKey = buildOwnerKeyFromUserId(authUser?.id ?? null);
  const setChatOwnerKey = useChatStore((state) => state.setActiveOwnerKey);
  const setPaymentOwnerKey = usePaymentStore((state) => state.setActiveOwnerKey);
  const setActiveProfileKey = usePaymentStore((state) => state.setActiveProfileKey);
  const refreshQuota = usePaymentStore((state) => state.refreshQuota);
  const isValid = usePaymentStore((state) => state.hasValidPass());
  const remaining = usePaymentStore((state) => state.getRemainingQuestions());
  const isQuotaReady = usePaymentStore((state) => state.isQuotaReady);
  const isRefreshing = usePaymentStore((state) => state.isRefreshing);
  const quotaState = usePaymentStore((state) => state.quotaState);
  const quotaError = usePaymentStore((state) => state.quotaError);
  const syncedOwnerKey = usePaymentStore((state) => state.syncedOwnerKey);

  const isOwnerVerified = Boolean(authOwnerKey);
  const isProfileReadyForChat = hasCompleteBirthProfile(authProfile ?? {});
  const ownerSource = isOwnerVerified ? "auth-user" : "guest";

  useEffect(() => {
    setService("saju", "saju-ai-chat");
  }, [setService]);

  useEffect(() => {
    setChatOwnerKey(authOwnerKey);
    setPaymentOwnerKey(authOwnerKey);
  }, [authOwnerKey, setChatOwnerKey, setPaymentOwnerKey]);

  useEffect(() => {
    const nextContext = buildChatContextFromAuthProfile(authProfile);
    if (!nextContext) {
      if (sajuContext) {
        setSajuContext(null);
      }
      return;
    }

    const nextProfileKey = buildChatProfileKeyFromContext(nextContext);
    const currentProfileKey = sajuContext ? buildChatProfileKeyFromContext(sajuContext) : null;
    if (nextProfileKey === currentProfileKey) {
      return;
    }

    setSajuContext(nextContext);
  }, [authProfile, sajuContext, setSajuContext]);

  useEffect(() => {
    if (!sajuContext) {
      setActiveProfileKey(null);
      return;
    }
    setActiveProfileKey(buildChatProfileKeyFromContext(sajuContext));
  }, [sajuContext, setActiveProfileKey]);

  useEffect(() => {
    if (!isOwnerVerified || !isProfileReadyForChat) {
      return;
    }
    void refreshQuota();
  }, [authOwnerKey, isOwnerVerified, isProfileReadyForChat, refreshQuota]);

  const tryPurchaseDayPass = () => false;

  return {
    isValid: isOwnerVerified && isValid,
    purchaseDayPass: tryPurchaseDayPass,
    remaining,
    isQuotaReady,
    isRefreshing,
    quotaState,
    quotaError,
    syncedOwnerKey,
    refreshQuota,
    isPaidChatOpen: PAID_CHAT_OPEN,
    isOwnerVerified,
    isProfileReadyForChat,
    ownerSource,
  };
}

