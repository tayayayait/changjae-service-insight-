import { create } from "zustand";
import { UserBirthData, SajuResult, AstrologyResult, FortuneResult } from "../types/result";

export type ServiceType = "saju" | "astrology" | "palmistry" | "compatibility" | "love";

interface ConsultState {
  // 현재 진행 중인 서비스 정보
  currentService: ServiceType | null;
  serviceId: string | null;
  
  // 사용자 공통 입력 정보 (한 번 입력하면 세션 내 유지)
  userProfile: Partial<UserBirthData> & { name?: string };
  
  // 진행 상태
  step: number;
  isAnalyzing: boolean;
  
  // 분석 결과 (최종 결과)
  sajuResult: SajuResult | null;
  astroResult: AstrologyResult | null;
  fortuneResult: FortuneResult | null;
  palmResult: unknown | null; // 손금은 전용 타입 추후 보강
  
  // 에러 메시지
  error: string | null;

  // 배경 프로젝트 ID (글로벌 배경 제어용)
  unicornProjectId: string | null;

  // Actions
  setUnicornProjectId: (id: string | null) => void;
  setService: (type: ServiceType, id: string) => void;
  updateProfile: (data: Partial<UserBirthData> & { name?: string }) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setAnalyzing: (loading: boolean) => void;
  setSajuResult: (result: SajuResult) => void;
  setAstroResult: (result: AstrologyResult) => void;
  reset: () => void;
}

export const useConsultStore = create<ConsultState>((set) => ({
  currentService: null,
  serviceId: null,
  userProfile: {},
  step: 1,
  isAnalyzing: false,
  sajuResult: null,
  astroResult: null,
  fortuneResult: null,
  palmResult: null,
  error: null,
  unicornProjectId: null,

  setUnicornProjectId: (id) => set((state) => {
    if (state.unicornProjectId === id) return state;
    return { unicornProjectId: id };
  }),

  setService: (type, id) => set({ 
    currentService: type, 
    serviceId: id,
    userProfile: {}, // 서비스 전환 시 기존 입력 정보 초기화 (독립성 보장)
    step: 1, 
    isAnalyzing: false,
    error: null 
  }),

  updateProfile: (data) => set((state) => ({ 
    userProfile: { ...state.userProfile, ...data } 
  })),

  setStep: (step) => set({ step }),
  
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  
  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),

  setAnalyzing: (loading) => set({ isAnalyzing: loading }),

  setSajuResult: (result) => set({ sajuResult: result, isAnalyzing: false }),

  setAstroResult: (result) => set({ astroResult: result, isAnalyzing: false }),

  reset: () => set({
    currentService: null,
    serviceId: null,
    userProfile: {}, // 사용자 정보도 함께 초기화
    step: 1,
    isAnalyzing: false,
    sajuResult: null,
    astroResult: null,
    fortuneResult: null,
    palmResult: null,
    error: null
  }),
}));
