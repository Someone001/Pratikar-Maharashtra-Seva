import React, { useEffect, useState } from 'react';

export interface CountdownProps {
  submittedAt?: string; // ISO 8601 string
  dueAt?: string; // Optional pre-calculated deadline, defaults to submittedAt + 24 hours
  deadline?: string;
  label?: string;
  onExpire?: () => void;
  className?: string;
}

export const Countdown: React.FC<CountdownProps> = ({
  submittedAt,
  dueAt,
  deadline,
  label,
  onExpire,
  className = '',
}) => {
  const effectiveDeadline = deadline || dueAt;
  const targetDate = effectiveDeadline
    ? new Date(effectiveDeadline).getTime()
    : submittedAt
      ? new Date(submittedAt).getTime() + 24 * 60 * 60 * 1000
      : Date.now() + 24 * 60 * 60 * 1000;

  const totalDurationMs = 24 * 60 * 60 * 1000;

  const [timeLeftMs, setTimeLeftMs] = useState<number>(() => targetDate - Date.now());

  useEffect(() => {
    const updateCountdown = () => {
      const remaining = targetDate - Date.now();
      setTimeLeftMs(remaining);
      if (remaining <= 0 && onExpire) {
        onExpire();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onExpire]);

  const isExpired = timeLeftMs <= 0;
  const absDiff = Math.abs(timeLeftMs);

  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

  // Percentage elapsed from submission to deadline
  const elapsedMs = Math.max(0, totalDurationMs - timeLeftMs);
  const percentElapsed = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

  const isCritical = !isExpired && hours < 6;

  return (
    <div
      role="timer"
      aria-live="polite"
      className={`rounded-xl border p-4 transition-all ${
        isExpired
          ? 'border-warning/50 bg-warning-surface/30 text-foreground'
          : isCritical
            ? 'border-amber-500/50 bg-amber-950/20 text-foreground'
            : 'border-border bg-card text-card-foreground'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isExpired
                  ? 'bg-warning animate-pulse'
                  : isCritical
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-primary'
              }`}
              aria-hidden="true"
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label || (isExpired ? 'Statutory 24h Window Expired' : 'Statutory 24-Hour Removal Deadline')}
            </span>
          </div>

          <div className="text-2xl font-bold tracking-tight font-mono">
            {hours.toString().padStart(2, '0')}:
            {minutes.toString().padStart(2, '0')}:
            {seconds.toString().padStart(2, '0')}
            <span className="ml-2 text-xs font-normal text-muted-foreground font-sans">
              {isExpired ? 'ago' : 'remaining'}
            </span>
          </div>
        </div>

        {isExpired && (
          <div className="rounded-lg bg-warning/20 border border-warning/40 px-3 py-1.5 text-xs font-medium text-warning-fg self-start sm:self-center">
            Platform Missed 24h Deadline: Escalate to GAC / 1930
          </div>
        )}
      </div>

      <div className="mt-3">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-surface"
          role="progressbar"
          aria-valuenow={Math.round(percentElapsed)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full transition-all duration-1000 ${
              isExpired
                ? 'bg-warning'
                : isCritical
                  ? 'bg-amber-400'
                  : 'bg-primary'
            }`}
            style={{ width: `${percentElapsed}%` }}
          />
        </div>
      </div>
    </div>
  );
};

