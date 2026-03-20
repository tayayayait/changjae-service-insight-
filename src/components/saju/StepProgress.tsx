interface StepProgressProps {
  current: number;
  total: number;
}

export function StepProgress({ current, total }: StepProgressProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-caption text-text-secondary">Step {current} of {total}</span>
        <span className="text-caption text-text-muted">{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-[#24303F] transition-normal" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
