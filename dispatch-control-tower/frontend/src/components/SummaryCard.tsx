import React from 'react';

type CardColor = 'blue' | 'green' | 'amber' | 'red' | 'purple';

const borderColors: Record<CardColor, string> = {
  blue: 'border-l-sf-orange',
  green: 'border-l-sf-success',
  amber: 'border-l-sf-warning',
  red: 'border-l-sf-danger',
  purple: 'border-l-purple-500',
};

const iconBgColors: Record<CardColor, string> = {
  blue: 'bg-sf-orange-light text-sf-orange',
  green: 'bg-emerald-100 text-sf-success',
  amber: 'bg-amber-100 text-sf-warning',
  red: 'bg-red-100 text-sf-danger',
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
      className={`bg-white rounded-lg border border-sf-border border-l-4 ${borderColors[color]} p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sf-text-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-sf-text-900">{value}</p>
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
