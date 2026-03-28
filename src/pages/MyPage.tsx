import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, History, ArrowRight, Loader2, UserCheck, AlertTriangle, FileText, Clock3 } from "lucide-react";
import { useAccountLookup } from "@/hooks/account/useAccountLookup";
import { getPaidReport } from "@/lib/paidReportCatalog";

const REPORT_RETENTION_DAYS = 30;
const REPORT_RETENTION_MS = REPORT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export default function MyPage() {
  const {
    buyerName,
    setBuyerName,
    buyerPhone,
    setBuyerPhone,
    buyerEmail,
    setBuyerEmail,
    loading,
    results,
    hasSearched,
    errorMessage,
    handleLookup,
  } = useAccountLookup();

  const getServiceLabel = (serviceId: string) => {
    const paidItem = getPaidReport(serviceId);
    if (paidItem) return paidItem.title;
    if (serviceId.includes("astro")) return "점성 리포트";
    if (serviceId.includes("new-year")) return "2026 신년운세";
    if (serviceId.includes("lifetime")) return "인생 총운";
    if (serviceId.includes("compat")) return "커플 궁합";
    return "사주 리포트";
  };

  const getServiceCategoryLabel = (serviceId: string) => {
    const paidItem = getPaidReport(serviceId);
    return paidItem?.categoryLabel ?? "사주 서비스";
  };

  const toRetentionLabel = (paidAt: string) => {
    const paidAtMs = Date.parse(paidAt);
    const safePaidAtMs = Number.isFinite(paidAtMs) ? paidAtMs : Date.now();
    const expiryDate = new Date(safePaidAtMs + REPORT_RETENTION_MS);
    const remainingDays = Math.max(
      0,
      Math.ceil((expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    );

    return {
      paidDateLabel: new Date(safePaidAtMs).toLocaleDateString("ko-KR"),
      expiryDateLabel: expiryDate.toLocaleDateString("ko-KR"),
      remainingBadge: remainingDays > 0 ? `보관 D-${remainingDays}` : "오늘 만료",
    };
  };

  const normalizedLookupState = {
    buyerName: buyerName.trim().replace(/\s+/g, " "),
    buyerPhone: buyerPhone.replace(/[^0-9]/g, ""),
    buyerEmail: buyerEmail.trim().toLowerCase(),
  };

  return (
    <AppLayout hideFooter={true}>
      <div className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10">
        {/* 헤더 */}
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#24303F]">
              <FileText className="h-6 w-6 text-[#C9A86A]" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">리포트 다시보기</h1>
              <p className="text-sm text-muted-foreground">
                결제 시 입력한 정보로 구매 리포트를 다시 확인하세요.
              </p>
            </div>
          </div>
        </header>

        <div className="rounded-2xl border border-amber-300/80 bg-amber-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-amber-900">
                구매한 리포트는 결제일 기준 30일간 홈페이지에 보관됩니다.
              </p>
              <p className="text-xs font-semibold text-amber-800">
                AI 사주상담 구매 내역은 이 목록에서 제외됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 조회 폼 */}
        <Card className="overflow-hidden rounded-3xl border-border/70 bg-white shadow-sm">
          <CardHeader className="border-b border-border/50 bg-[#FAF7F2]/60 p-6">
            <CardTitle className="inline-flex items-center gap-2 text-lg font-bold">
              <UserCheck className="h-5 w-5 text-[#C9A86A]" />
              본인 확인
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleLookup} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lookup-name" className="ml-1 text-sm font-semibold">
                    주문자 성함
                  </Label>
                  <Input
                    id="lookup-name"
                    placeholder="홍길동"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="h-12 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lookup-phone" className="ml-1 text-sm font-semibold">
                    휴대폰 번호
                  </Label>
                  <Input
                    id="lookup-phone"
                    type="tel"
                    placeholder="01012345678"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="h-12 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="lookup-email" className="ml-1 text-sm font-semibold">
                    이메일
                  </Label>
                  <Input
                    id="lookup-email"
                    type="email"
                    placeholder="example@email.com"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="h-12 rounded-xl"
                    required
                  />
                  <p className="ml-1 text-[11px] text-muted-foreground">
                    결제 시 입력한 이메일과 동일하게 입력해주세요.
                  </p>
                </div>
              </div>
              <Button
                type="submit"
                className="h-14 w-full rounded-2xl bg-primary text-lg font-bold transition-all hover:bg-primary-hover"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                구매 내역 조회하기
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                개인정보 보호를 위해 입력하신 정보는 조회 목적으로만 사용되며 저장되지 않습니다.
              </p>
              {errorMessage ? (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {errorMessage}
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>

        {/* 조회 결과 */}
        {hasSearched ? (
          <div className="animate-in slide-in-from-bottom-4 space-y-4 fade-in duration-500">
            <h3 className="flex items-center gap-2 px-1 text-lg font-bold text-foreground">
              조회 결과
              <span className="text-sm font-normal text-muted-foreground">({results?.length || 0}건)</span>
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-20">
                <Loader2 className="h-10 w-10 animate-spin text-[#C9A86A]/50" />
                <p className="font-medium text-muted-foreground">리포트를 찾는 중...</p>
              </div>
            ) : results && results.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {results.map((item) => {
                  const retention = toRetentionLabel(item.paidAt);

                  return (
                    <Link
                      key={item.orderId}
                      to={
                        item.report.service_type === "astro"
                          ? `/astrology/purchased/${item.report.id}`
                          : item.report.service_type === "saju"
                            ? `/saju/purchased/${item.report.id}`
                            : `/result/${item.report.id}`
                      }
                      state={normalizedLookupState}
                      className="group block rounded-3xl border border-border/70 bg-white p-5 shadow-sm transition-all hover:border-[#C9A86A]/60 hover:shadow-lg"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0 space-y-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-gray-500 tabular-nums">
                              {item.orderNumber}
                            </span>
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">결제완료</span>
                            <span className="rounded-md bg-[#24303F]/10 px-2 py-0.5 text-xs font-bold text-[#24303F]">
                              {retention.remainingBadge}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold text-muted-foreground">
                              {getServiceCategoryLabel(item.report.service_id)}
                            </p>
                            <h4 className="truncate text-lg font-black text-foreground transition-colors group-hover:text-[#C9A86A] md:text-xl">
                              {getServiceLabel(item.report.service_id)}
                            </h4>
                          </div>
                          <dl className="grid grid-cols-1 gap-3 rounded-2xl border border-border/70 bg-[#FAF7F2]/70 p-4 text-sm sm:grid-cols-3">
                            <div>
                              <dt className="text-[11px] font-semibold text-muted-foreground">결제일</dt>
                              <dd className="mt-1 font-semibold text-foreground">{retention.paidDateLabel}</dd>
                            </div>
                            <div>
                              <dt className="text-[11px] font-semibold text-muted-foreground">보관 만료일</dt>
                              <dd className="mt-1 font-semibold text-foreground">{retention.expiryDateLabel}</dd>
                            </div>
                            <div>
                              <dt className="text-[11px] font-semibold text-muted-foreground">결제 금액</dt>
                              <dd className="mt-1 font-semibold text-foreground">₩{item.amount_krw.toLocaleString()}</dd>
                            </div>
                          </dl>
                        </div>
                        <div className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 transition-all group-hover:bg-[#C9A86A]/20 group-hover:text-[#C9A86A]">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-white px-6 py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <History className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-bold text-foreground">구매 내역이 없습니다</h4>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  입력 정보가 정확하지 않거나 30일 보관 기간이 지난 내역은 조회되지 않습니다.
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* 하단 안내 */}
        <div className="border-t border-border/70 pt-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">도움이 필요하신가요?</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-10 rounded-full px-6"
                onClick={() => (window.location.href = "mailto:support@sajuflow.com")}
              >
                문의하기
              </Button>
              <Link to="/help">
                <Button variant="ghost" className="h-10 rounded-full px-6 text-muted-foreground">
                  자주 묻는 질문
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
