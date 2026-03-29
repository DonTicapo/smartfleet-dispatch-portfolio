import React from 'react';

type Variant =
  | 'green'
  | 'blue'
  | 'yellow'
  | 'amber'
  | 'red'
  | 'gray'
  | 'orange'
  | 'purple';

const variantClasses: Record<Variant, string> = {
  green: 'bg-emerald-100 text-emerald-800',
  blue: 'bg-blue-100 text-blue-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-slate-100 text-slate-600',
  orange: 'bg-orange-100 text-orange-800',
  purple: 'bg-purple-100 text-purple-800',
};

// Assignment status colors
const assignmentStatusColors: Record<string, Variant> = {
  PENDING: 'yellow',
  CONFIRMED: 'blue',
  IN_PROGRESS: 'amber',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

// Truck status colors
const truckStatusColors: Record<string, Variant> = {
  AVAILABLE: 'green',
  ASSIGNED: 'blue',
  MAINTENANCE: 'yellow',
  OUT_OF_SERVICE: 'red',
};

// Driver status colors
const driverStatusColors: Record<string, Variant> = {
  AVAILABLE: 'green',
  ASSIGNED: 'blue',
  OFF_DUTY: 'gray',
  SUSPENDED: 'red',
};

// Exception type colors
const exceptionTypeColors: Record<string, Variant> = {
  DELAY: 'yellow',
  NO_SHOW: 'red',
  PLANT_ISSUE: 'orange',
  ASSET_FAILURE: 'purple',
  DRIVER_ISSUE: 'amber',
  OTHER: 'gray',
};

// Exception status colors
const exceptionStatusColors: Record<string, Variant> = {
  OPEN: 'red',
  ACKNOWLEDGED: 'yellow',
  IN_PROGRESS: 'blue',
  RESOLVED: 'green',
  CLOSED: 'gray',
};

// Exception severity colors
const severityColors: Record<string, Variant> = {
  LOW: 'gray',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red',
};

type StatusCategory =
  | 'assignment'
  | 'truck'
  | 'driver'
  | 'exceptionType'
  | 'exceptionStatus'
  | 'severity';

const categoryMaps: Record<StatusCategory, Record<string, Variant>> = {
  assignment: assignmentStatusColors,
  truck: truckStatusColors,
  driver: driverStatusColors,
  exceptionType: exceptionTypeColors,
  exceptionStatus: exceptionStatusColors,
  severity: severityColors,
};

interface Props {
  value: string;
  category: StatusCategory;
}

export default function StatusBadge({ value, category }: Props) {
  const colorMap = categoryMaps[category];
  const variant = colorMap[value] ?? 'gray';
  const classes = variantClasses[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}
    >
      {value.replace(/_/g, ' ')}
    </span>
  );
}

// Prevent unused import warning
void React;
