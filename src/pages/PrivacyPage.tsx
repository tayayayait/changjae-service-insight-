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
                <li><strong>필수 항목:</strong> 생년월일시, 성별, 출생지 (서비스 제공 및 정확한 분석 리포트 생성)</li>
                <li><strong>결제 항목:</strong> 유료 서비스 이용 시 결제 수단 확인 및 승인 (결제 대행사에서 처리)</li>
                <li><strong>자동 수집 항목:</strong> 접속 로그, 기기 정보, 쿠키 (부정 이용 방지 및 통계 분석)</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-h4 text-foreground font-medium border-b border-border pb-2">2. 개인정보의 보유 및 이용 기간</h2>
              <p className="text-body text-text-secondary leading-relaxed">
                이용자의 개인정보는 수집 목적이 달성되면 지체 없이 파기합니다. 단, 관련 법령에 따라 다음과 같이 일정 기간 보관합니다.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-body text-text-secondary">
                <li><strong>계약 또는 청약철회 등에 관한 기록:</strong> 5년 (전자상거래법)</li>
                <li><strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년 (전자상거래법)</li>
                <li><strong>소비자의 불만 또는 분쟁처리에 관한 기록:</strong> 3년 (전자상거래법)</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-h4 text-foreground font-medium border-b border-border pb-2">3. 개인정보의 제3자 제공</h2>
              <p className="text-body text-text-secondary leading-relaxed">
                회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 서비스 이용 및 결제 처리를 위해 아래와 같이 최소한의 정보를 제공합니다.
              </p>
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-sm text-left border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-2">제공받는 자</th>
                      <th className="border border-border p-2">제공 목적</th>
                      <th className="border border-border p-2">제공 항목</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-2">KG이니시스, 카카오페이, 포트원</td>
                      <td className="border border-border p-2">결제 처리 및 본인 인증</td>
                      <td className="border border-border p-2">결제 정보, 이름, 휴대폰 번호</td>
                    </tr>
                  </tbody>
                </table>
              </div>
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

