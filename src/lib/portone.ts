declare global {
  interface Window {
    PortOne?: {
      requestPayment: (params: Record<string, unknown>) => Promise<Record<string, unknown>>;
    };
  }
}

export interface PaymentRequest {
  pg: string;
  pay_method: string;
  merchant_uid: string;
  name: string;
  amount: number;
  buyer_email?: string;
  buyer_name?: string;
  buyer_tel?: string;
}

export interface PortonePaymentResult {
  success: boolean;
  merchant_uid: string;
  imp_uid?: string;
  simulated?: boolean;
  [key: string]: unknown;
}

/**
 * PortOne V2 SDK를 통해 실제 결제창을 호출합니다.
 * 기존 PaymentRequest(V1 형식)를 V2 SDK 매개변수로 자동 변환합니다.
 */
export const requestPayment = async (request: PaymentRequest): Promise<PortonePaymentResult> => {
  if (!window.PortOne) {
    throw new Error("결제 모듈(PortOne SDK)을 불러오지 못했습니다. 페이지를 새로고침해 주세요.");
  }

  const storeId = import.meta.env.VITE_PORTONE_STORE_ID;
  const channelKey = import.meta.env.VITE_PORTONE_CHANNEL_KEY;

  if (!storeId || !channelKey) {
    throw new Error("결제 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.");
  }

  const response = await window.PortOne.requestPayment({
    storeId,
    channelKey,
    paymentId: request.merchant_uid,
    orderName: request.name,
    totalAmount: request.amount,
    currency: "CURRENCY_KRW",
    payMethod: "CARD",
    customer: {
      fullName: request.buyer_name,
      phoneNumber: request.buyer_tel,
      email: request.buyer_email,
    },
  });

  // V2 SDK: 에러 시 response.code가 존재
  if (response && typeof response.code === "string") {
    if (response.code === "FAILURE_TYPE_PG" || response.code === "FAILURE_TYPE_CANCEL") {
      return {
        success: false,
        merchant_uid: request.merchant_uid,
        code: response.code,
        message: String(response.message || "결제가 취소되었습니다."),
      };
    }
    return {
      success: false,
      merchant_uid: request.merchant_uid,
      code: response.code,
      message: String(response.message || "결제에 실패했습니다."),
    };
  }

  return {
    success: true,
    merchant_uid: request.merchant_uid,
    imp_uid: String(response?.txId || response?.paymentId || ""),
    paymentId: response?.paymentId,
    txId: response?.txId,
  };
};
