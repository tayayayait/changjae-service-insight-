import { useCallback } from 'react';

declare global {
  interface Window {
    PortOne?: any;
  }
}

export type PaymentParams = {
  storeId?: string;
  channelKey?: string;
  paymentId: string;
  orderName: string;
  totalAmount: number;
  currency?: string;
  payMethod?: string;
  customer?: {
    fullName?: string;
    phoneNumber?: string;
    email?: string;
  };
};

export const usePayment = () => {
  const requestPayment = useCallback(async (params: PaymentParams) => {
    if (!window.PortOne) {
      console.error('PortOne SDK not loaded');
      return { success: false, error: 'SDK_NOT_LOADED', message: '결제 모듈을 불러오지 못했습니다.' };
    }

    const {
      storeId = import.meta.env.VITE_PORTONE_STORE_ID,
      channelKey = import.meta.env.VITE_PORTONE_CHANNEL_KEY,
      currency = 'CURRENCY_KRW',
      payMethod = 'CARD',
      ...rest
    } = params;

    try {
      const response = await window.PortOne.requestPayment({
        storeId,
        channelKey,
        currency,
        payMethod,
        ...rest,
      });

      if (response && response.code !== undefined) {
        return { success: false, code: response.code, message: response.message };
      }

      return { success: true, paymentId: response?.paymentId, txId: response?.txId };
    } catch (error) {
      console.error('Payment request error:', error);
      return { success: false, error: 'UNKNOWN_ERROR', message: '결제 요청 중 알 수 없는 오류가 발생했습니다.' };
    }
  }, []);

  return { requestPayment };
};
