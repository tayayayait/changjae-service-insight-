interface ConfidenceNotesCardProps {
  summary: string;
  evidenceSummary?: string;
  notes: string[];
}

export function ConfidenceNotesCard({ summary, evidenceSummary, notes }: ConfidenceNotesCardProps) {
  return (
    <details className="rounded-[24px] border border-border bg-white p-5 group">
      <summary className="cursor-pointer list-none">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-text-secondary">해석 근거 노트</p>
        <h3 className="mt-2 text-[18px] font-bold text-foreground">이 판단은 무엇을 근거로 했나</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">{summary}</p>
      </summary>
      <div className="mt-4 space-y-3 border-t border-border pt-4 text-[14px] leading-relaxed text-text-secondary">
        {evidenceSummary ? <p>{evidenceSummary}</p> : null}
        {notes.map((note, index) => (
          <div key={`confidence-${index}`} className="rounded-2xl bg-[#F8FAFC] p-3">
            {note}
          </div>
        ))}
      </div>
    </details>
  );
}
