import { supabase, isSupabaseConfigured } from "./supabase";
import { ensureGuestSessionId } from "./resultStore";

export interface CreateOrderParams {
  serviceId: string;
  serviceType: string;
  buyerInfo: {
    name: string;
    phone: string;
    email?: string;
    amount: number;
  };
  inputSnapshot?: any;
  reportPayload?: any;
  previewPayload?: any;
  reportId?: string;
}

export interface CreateOrderResponse {
  ok: boolean;
  orderNumber: string;
  orderId: string;
  reportId: string;
  error?: string;
}

export const createOrder = async (params: CreateOrderParams): Promise<CreateOrderResponse> => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured");
  }

  const guestId = ensureGuestSessionId();

  const { data, error } = await supabase.functions.invoke("create-order", {
    body: params,
    headers: {
      "x-guest-id": guestId,
    },
  });

  if (error) {
    console.error("create-order invoke error:", error);
    throw new Error(error.message || "Failed to create order");
  }

  return data as CreateOrderResponse;
};
