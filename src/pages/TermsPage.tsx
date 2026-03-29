import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-3xl space-y-8 px-6 py-12">
        <div className="space-y-2">
          <h1 className="text-h2 text-foreground font-semibold">이용약관</h1>
          <p className="text-body text-text-secondary">최종 업데이트: 2026-03-29</p>
        </div>

        <Card className="rounded-xl border-border p-8 bg-card shadow-sm">
          <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
            <section className="space-y-3">
              <h2 className="text-h4 text-foreground font-medium border-b border-border pb-2">제1조 (목적)</h2>
              <p className="text-body text-text-secondary leading-relaxed">
                본 약관은 '타야잇시스템즈'(이하 "회사")가 운영하는 '사주 인사이트'(이하 "서비스")에서 제공하는 AI 사주 분석 리포트 및 관련 디지털 콘텐츠 이용과 관련하여, 회사와 이용자의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-h4 text-foreground font-medium border-b border-border pb-2">제2조 (서비스의 제공)</h2>
              <p className="text-body text-text-secondary leading-relaxed">
                회사는 이용자에게 다음과 같은 서비스를 제공합니다.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-body text-text-secondary">
                <li>AI 기반 사주 및 운세 분석 리포트 생성 및 제공</li>
                <li>무료 운세 정보 및 명리학 관련 콘텐츠 제공</li>
                <li>기타 회사가 정하는 관련 서비스</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-h4 text-foreground font-medium border-b border-border pb-2">제3조 (이용요금 및 결제)</h2>
              <p className="text-body text-text-secondary leading-relaxed">
                이용자는 회사가 정한 결제 수단(신용카드, 카카오페이 등)을 통해 유료 서비스를 이용할 수 있습니다. 결제 금액은 각 상품 상세 페이지에 명시된 금액을 기준으로 합니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-h4 text-foreground font-medium border-b border-border pb-2">제4조 (배송 및 제공 방식)</h2>
              <p className="text-body text-text-secondary leading-relaxed">
                본 서비스에서 제공하는 유료 리포트는 실물 배송이 없는 **디지털 콘텐츠**입니다. 결제가 완료되는 즉시 온라인을 통해 분석 결과가 생성되어 화면에 표시되거나 저장됩니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-h4 text-foreground font-medium border-b border-border pb-2">제5조 (청약철회 및 환불 규정)</h2>
              <p className="text-body text-text-secondary leading-relaxed">
                본 서비스는 「전자상거래 등에서의 소비자보호에 관한 법률」 및 「콘텐츠산업 진흥법」을 준수합니다.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-body text-text-secondary leading-relaxed font-medium">
                <li className="text-foreground">디지털 콘텐츠 특성상, 분석 및 리포트 생성이 시작된 이후에는 상품의 가치가 즉시 소비되므로 청약철회(환불)가 불가능합니다.</li>
                <li>단, 회사의 기술적 오류로 인해 리포트가 정상적으로 생성되지 않거나 내용을 확인할 수 없는 경우, 전액 환불 또는 재분석을 진행해 드립니다.</li>
                <li>중복 결제 등 오결제의 경우, 수수료를 제외한 금액을 환불 처리합니다.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-h4 text-foreground font-medium border-b border-border pb-2">제6조 (면책 조항)</h2>
              <p className="text-body text-text-secondary leading-relaxed">
                본 서비스에서 제공하는 모든 분석 결과는 참고용 정보이며, 법률, 의료, 투자 등 전문적인 조언으로 간주될 수 없습니다. 이용자는 리포트 내용을 바탕으로 개인의 중대한 결정을 내릴 때 각별히 유의해야 합니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-h4 text-foreground font-medium border-b border-border pb-2">제7조 (고객센터)</h2>
              <p className="text-body text-text-secondary leading-relaxed">
                서비스 이용 관련 문의 및 환불 요청은 아래 채널을 이용해 주시기 바랍니다.
              </p>
              <ul className="list-none space-y-1 text-body text-text-secondary">
                <li>• 이메일: dbcdkwo629@naver.com</li>
                <li>• 고객센터: 010-9487-4173</li>
              </ul>
            </section>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
