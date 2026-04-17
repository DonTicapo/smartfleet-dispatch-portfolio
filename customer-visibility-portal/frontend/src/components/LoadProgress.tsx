import React from 'react';
import type { LoadStatus } from '../types';

const STEPS: LoadStatus[] = [
  'SCHEDULED',
  'LOADING',
  'LOADED',
  'EN_ROUTE',
  'ON_SITE',
  'POURING',
  'RETURNING',
  'COMPLETED',
];

const STEP_LABELS: Record<LoadStatus, string> = {
  SCHEDULED: 'Scheduled',
  LOADING: 'Loading',
  LOADED: 'Loaded',
  EN_ROUTE: 'En Route',
  ON_SITE: 'On Site',
  POURING: 'Pouring',
  RETURNING: 'Returning',
  COMPLETED: 'Completed',
};

interface Props {
  currentStatus: LoadStatus;
}

export default function LoadProgress({ currentStatus }: Props) {
  const currentIndex = STEPS.indexOf(currentStatus);

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center min-w-[640px]">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;

          return (
            <React.Fragment key={step}>
              {/* Step circle + label */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                    ${
                      isCompleted
                        ? 'bg-sf-orange text-white'
                        : isCurrent
                          ? 'bg-sf-orange text-white ring-4 ring-sf-orange-light'
                          : 'bg-slate-200 text-slate-500'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`mt-1.5 text-[10px] font-medium whitespace-nowrap ${
                    isCompleted || isCurrent
                      ? 'text-sf-orange'
                      : 'text-slate-400'
                  }`}
                >
                  {STEP_LABELS[step]}
                </span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 min-w-[24px] ${
                    i < currentIndex ? 'bg-sf-orange' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
