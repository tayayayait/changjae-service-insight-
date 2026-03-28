import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-3xl space-y-8 px-6 py-12">
        <div className="space-y-2">
          <h1 className="text-h2 text-foreground font-semibold">개인정보 처리방침</h1>
          <p className="text-body text-text-secondary">최종 업데이트: 2026-03-28</p>
        </div>

        <Card className="rounded-xl border-border p-8 bg-card shadow-sm">
          <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
            <p className="text-body text-foreground leading-relaxed">
              본 서비스는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 철저히 준수하고 있습니다.
              본 개인정보 처리방침은 서비스 이용 시 수집되는 개인정보의 항목, 목적, 보유 기간, 파기 절차 등을 투명하게 안내합니다.
            </p>

            <section className="space-y-3">
              <h2 className="text-h4 text-foreground font-medium border-b border-border pb-2">1. 수집하는 개인정보 항목 및 목적</h2>
              <ul className="list-disc pl-5 space-y-2 text-body text-text-secondary leading-relaxed marker:text-text-secondary">
                <li><strong>필수 항목:</strong> 생년월일시, 성별, 출생지 (사주 및 운세 분석 서비스 제공, 정확한 명리학적 리포트 생성)</li>
                <li><strong>선택 항목:</strong> 관심사 (맞춤형 운세 정보 제공), 이메일 주소 (클라우드 저장소 연동 및 계정 관리 시)</li>
                <li><strong>자동 수집 항목:</strong> 서비스 이용 기록, 접속 로그, 쿠키, 접속 기기 정보 (부정 이용 방지 및 통계 분석)</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-h4 text-foreground font-medium border-b border-border pb-2">2. 개인정보의 로컬 및 클라우드 저장</h2>
              <p className="text-body text-text-secondary leading-relaxed">
                사용자의 민감한 사주 명식 데이터는 최고의 보안을 위해 원칙적으로 기기 내에만 저장(Local-Only)됩니다.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-body text-text-secondary leading-relaxed marker:text-text-secondary">
                <li><strong>기본 저장 모드:</strong> 분석 데이터는 이용자의 브라우저 로컬 스토리지에만 저장되며, 외부 서버로 전송되지 않습니다.</li>
                <li><strong>서버 연동 모드:</strong> 사용자가 안전한 백업을 위해 명시적으로 "클라우드 저장(Cloud-Save)" 옵션을 활성화하거나, 소셜 로그인을 통해 로그인한 경우에 한하여 암호화되어 중앙 서버로 전송 및 보관됩니다.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-h4 text-foreground font-medium border-b border-border pb-2">3. 개인정보의 보유 및 이용 기간</h2>
              <p className="text-body text-text-secondary leading-relaxed">
                원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 보호법 및 전자상거래 등에서의 소비자보호에 관한 법률 등 관계 법령의 규정에 의하여 보존할 필요가 있는 경우, 회사는 법령에서 정한 일정한 기간 동안 회원의 개인정보를 안전하게 보관합니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-h4 text-foreground font-medium border-b border-border pb-2">4. 개인정보의 파기절차 및 방법</h2>
              <p className="text-body text-text-secondary leading-relaxed">
                이용자는 언제든지 '리포트 다시보기' 메뉴 및 '내 정보' 설정 페이지에서 저장된(클라우드 및 로컬) 데이터 전체의 영구 삭제를 직접 요청하고 실행할 수 있습니다.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-body text-text-secondary leading-relaxed marker:text-text-secondary">
                <li><strong>파기 절차:</strong> 이용자가 삭제 요청한 정보는 즉시 처리되며, 백업 데이터 역시 보존기간 종료 후 안전하게 영구 삭제됩니다.</li>
                <li><strong>파기 방법:</strong> 전자적 파일 형태로 저장된 개인정보는 어떠한 기록도 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-h4 text-foreground font-medium border-b border-border pb-2">5. 이용자의 권리와 그 행사방법</h2>
              <p className="text-body text-text-secondary leading-relaxed">
                이용자(또는 만 14세 미만 아동의 경우 법정 대리인)는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입 해지(동의 철회)를 요청할 수 있습니다.
                개인정보의 오류에 대한 정정을 요청하신 경우, 정정을 완료하기 전까지 당해 개인정보를 이용 또는 처리하지 않습니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-h4 text-foreground font-medium border-b border-border pb-2">6. 개인정보 보호 담당자 및 문의처</h2>
              <p className="text-body text-text-secondary leading-relaxed">
                본 서비스는 이용자의 개인정보를 보호하고 관련 불만을 신속히 처리하기 위하여 아래와 같이 개인정보 취급 담당자를 지정하여 운영하고 있습니다.
              </p>
              <div className="mt-2 rounded-md bg-muted p-4 text-body text-text-secondary">
                <p>• 이메일 문의: dbcdkwo629@naver.com</p>
                <p>• 온라인 문의: 서비스 내 "고객센터 / 1:1 문의" 게시판</p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-h4 text-foreground font-medium border-b border-border pb-2">7. 고지 의무</h2>
              <p className="text-body text-text-secondary leading-relaxed">
                본 개인정보 처리방침의 내용 추가, 삭제 및 수정이 발생할 경우 시행일 최소 7일 전부터 서비스 내 '공지사항' 화면을 통해 이용자에게 사전 고지합니다.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

