import React from 'react';

type CardColor = 'blue' | 'green' | 'amber' | 'red' | 'purple';

const borderColors: Record<CardColor, string> = {
  blue: 'border-l-blue-500',
  green: 'border-l-emerald-500',
  amber: 'border-l-amber-500',
  red: 'border-l-red-500',
  purple: 'border-l-purple-500',
};

const iconBgColors: Record<CardColor, string> = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-emerald-100 text-emerald-600',
  amber: 'bg-amber-100 text-amber-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
};

interface Props {
  title: string;
  value: number;
  color: CardColor;
  icon: React.ReactNode;
}

export default function SummaryCard({ title, value, color, icon }: Props) {
  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 border-l-4 ${borderColors[color]} p-5 shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${iconBgColors[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
