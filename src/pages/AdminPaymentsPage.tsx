import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPaidReportLabel } from "@/lib/paidReportCatalog";
import { Loader2, ShieldCheck, CreditCard, Calendar, User, Mail, Phone } from "lucide-react";

const ADMIN_PIN = "1234";

interface PaymentRecord {
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhoneLast4: string;
  serviceId: string;
  serviceType: string;
  amountKrw: number;
  status: string;
  paidAt: string;
}

export default function AdminPaymentsPage() {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePinSubmit = () => {
    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
      setError("");
      void loadPayments();
    } else {
      setError("PIN이 올바르지 않습니다.");
    }
  };

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("order_number, buyer_name, buyer_email, buyer_phone_last4, service_id, service_type, amount_krw, status, paid_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      setPayments(
        (data ?? []).map((row) => ({
          orderNumber: row.order_number,
          buyerName: row.buyer_name ?? "—",
          buyerEmail: row.buyer_email ?? "—",
          buyerPhoneLast4: row.buyer_phone_last4 ?? "—",
          serviceId: row.service_id ?? "—",
          serviceType: row.service_type ?? "—",
          amountKrw: row.amount_krw ?? 0,
          status: row.status ?? "unknown",
          paidAt: row.paid_at ?? row.created_at ?? "—",
        })),
      );
    } catch (err) {
      console.error("Load payments error:", err);
      setError("결제 내역을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">결제완료</span>;
      case "pending":
        return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">대기</span>;
      case "cancelled":
        return <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">취소</span>;
      default:
        return <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-500">{status}</span>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6] px-5">
        <Card className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
              <ShieldCheck className="h-7 w-7 text-indigo-600" />
            </div>
            <CardTitle className="text-xl font-bold">관리자 인증</CardTitle>
            <p className="text-sm text-gray-500 mt-1">결제 내역을 조회하려면 PIN을 입력하세요.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="관리 PIN 입력"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
              className="h-12 rounded-xl text-center text-lg tracking-widest"
              maxLength={8}
            />
            {error ? <p className="text-center text-sm font-semibold text-red-500">{error}</p> : null}
            <Button
              onClick={handlePinSubmit}
              className="h-12 w-full rounded-xl bg-indigo-600 text-base font-bold text-white hover:bg-indigo-700"
            >
              인증
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-indigo-600" />
              결제 내역 관리
            </h1>
            <p className="mt-1 text-sm text-gray-500">전체 결제 내역을 조회합니다.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => void loadPayments()}
            disabled={loading}
            className="rounded-xl"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            새로고침
          </Button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <p className="text-lg font-bold text-gray-400">결제 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <Card key={payment.orderNumber} className="rounded-2xl border-gray-200/70 bg-white shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-gray-500 tabular-nums">
                          {payment.orderNumber}
                        </span>
                        {getStatusBadge(payment.status)}
                      </div>
                      <h4 className="text-base font-black text-gray-900">
                        {getPaidReportLabel(payment.serviceId)}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {payment.buyerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {payment.buyerEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          ****{payment.buyerPhoneLast4}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {payment.paidAt !== "—"
                            ? new Date(payment.paidAt).toLocaleString("ko-KR")
                            : "—"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-indigo-600">
                        ₩{payment.amountKrw.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
