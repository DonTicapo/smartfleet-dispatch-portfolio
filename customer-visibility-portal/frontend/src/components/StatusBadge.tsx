import React from 'react';

type BadgeColor = 'gray' | 'blue' | 'amber' | 'green' | 'red';

const COLOR_MAP: Record<string, BadgeColor> = {
  // Order statuses
  DRAFT: 'gray',
  CONFIRMED: 'blue',
  IN_PROGRESS: 'amber',
  COMPLETED: 'green',
  CANCELLED: 'red',
  // Ticket statuses
  PENDING: 'gray',
  SCHEDULED: 'blue',
  // Load statuses
  LOADING: 'amber',
  LOADED: 'blue',
  EN_ROUTE: 'amber',
  ON_SITE: 'amber',
  POURING: 'amber',
  RETURNING: 'blue',
  // Message severities
  INFO: 'blue',
  WARNING: 'amber',
  CRITICAL: 'red',
};

const CLASSES: Record<BadgeColor, string> = {
  gray: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
};

interface Props {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: Props) {
  const color = COLOR_MAP[status] ?? 'gray';
  const label = status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${CLASSES[color]} ${className}`}
    >
      {label}
    </span>
  );
}

// Prevent unused import warning in strict mode
void React;
