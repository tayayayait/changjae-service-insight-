import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-3xl space-y-4 px-6 py-8">
        <h1 className="text-h2 text-foreground">도움말</h1>
        <Card className="space-y-3 rounded-lg border-border p-6">
          <h2 className="text-title text-foreground">자주 묻는 질문</h2>
          <p className="text-body text-foreground">Q. 출생 시간을 모르면 분석이 불가능한가요? A. 가능합니다. 시간대 또는 모름을 선택해도 기본 분석은 제공됩니다.</p>
          <p className="text-body text-foreground">Q. 서버에 저장하지 않고 사용할 수 있나요? A. 가능합니다. 입력 1단계에서 local-only를 선택하면 브라우저에만 저장됩니다.</p>
          <p className="text-body text-foreground">Q. 데이터를 지우려면 어떻게 하나요? A. 마이페이지의 데이터 삭제 버튼을 사용하세요.</p>
        </Card>
      </div>
    </AppLayout>
  );
}
