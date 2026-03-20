import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-3xl space-y-4 px-6 py-8">
        <h1 className="text-h2 text-foreground">이용약관</h1>
        <Card className="space-y-4 rounded-lg border-border p-6">
          <p className="text-body text-foreground">본 서비스의 분석 결과는 참고 정보이며 법률, 의료, 투자 자문으로 간주되지 않습니다.</p>
          <p className="text-body text-foreground">서비스 악용, 자동화된 대량 요청, 타인 정보 무단 입력은 제한됩니다.</p>
          <p className="text-body text-foreground">유료 기능 및 외부 결제 연동은 추후 공지 후 별도 약관이 적용됩니다.</p>
          <p className="text-caption text-text-secondary">최종 업데이트: 2026-03-16</p>
        </Card>
      </div>
    </AppLayout>
  );
}
