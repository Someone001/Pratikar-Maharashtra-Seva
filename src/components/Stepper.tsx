import React from 'react';

export interface StepItem {
  id: string;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  activeStep: number; // 0-indexed
  completedSteps?: number[];
  onSelectStep?: (index: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  activeStep,
  completedSteps = [],
  onSelectStep,
  className = '',
}) => {
  return (
    <nav aria-label="Progress steps" className={`w-full overflow-x-auto py-2 ${className}`}>
      <ol className="flex items-center min-w-max gap-2 sm:gap-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index) || index < activeStep;
          const isActive = index === activeStep;
          const isClickable = !!onSelectStep;

          return (
            <li key={step.id} className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => onSelectStep?.(index)}
                aria-current={isActive ? 'step' : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors text-left ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : isCompleted
                      ? 'text-foreground hover:bg-surface/60 font-medium'
                      : 'text-muted-foreground'
                } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20'
                      : isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface text-muted-foreground border border-border'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm whitespace-nowrap">{step.title}</span>
                  {step.description && (
                    <span className="text-[11px] text-muted-foreground hidden md:block">
                      {step.description}
                    </span>
                  )}
                </div>
              </button>

              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-4 sm:w-8 transition-colors ${
                    index < activeStep ? 'bg-primary' : 'bg-border'
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
