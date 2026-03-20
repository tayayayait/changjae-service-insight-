import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-3xl space-y-4 px-6 py-8">
        <h1 className="text-h2 text-foreground">개인정보 처리방침</h1>
        <Card className="space-y-4 rounded-lg border-border p-6">
          <p className="text-body text-foreground">본 서비스는 사주 분석을 위해 생년월일시, 출생지, 관심사 정보를 처리합니다.</p>
          <p className="text-body text-foreground">기본 저장 모드는 local-only이며, 사용자가 cloud-save를 명시적으로 선택하거나 로그인한 경우에만 서버 저장이 수행됩니다.</p>
          <p className="text-body text-foreground">사용자는 마이페이지에서 저장 데이터 전체 삭제를 요청할 수 있습니다.</p>
          <p className="text-caption text-text-secondary">최종 업데이트: 2026-03-16</p>
        </Card>
      </div>
    </AppLayout>
  );
}
