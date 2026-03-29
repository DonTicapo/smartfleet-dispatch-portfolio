interface ServiceCardProps {
  name: string;
  port: string;
  description: string;
  features: string[];
  accentColor: string;
  iconPath: string;
  delay: number;
}

const accentStyles: Record<string, { border: string; bg: string; text: string; icon: string; glow: string }> = {
  blue: {
    border: 'border-blue-200 hover:border-blue-400',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: 'bg-blue-500',
    glow: 'group-hover:shadow-blue-100',
  },
  green: {
    border: 'border-emerald-200 hover:border-emerald-400',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    icon: 'bg-emerald-500',
    glow: 'group-hover:shadow-emerald-100',
  },
  amber: {
    border: 'border-amber-200 hover:border-amber-400',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    icon: 'bg-amber-500',
    glow: 'group-hover:shadow-amber-100',
  },
  purple: {
    border: 'border-purple-200 hover:border-purple-400',
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    icon: 'bg-purple-500',
    glow: 'group-hover:shadow-purple-100',
  },
  red: {
    border: 'border-red-200 hover:border-red-400',
    bg: 'bg-red-50',
    text: 'text-red-600',
    icon: 'bg-red-500',
    glow: 'group-hover:shadow-red-100',
  },
  teal: {
    border: 'border-teal-200 hover:border-teal-400',
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    icon: 'bg-teal-500',
    glow: 'group-hover:shadow-teal-100',
  },
};

function ServiceCard({ name, port, description, features, accentColor, iconPath, delay }: ServiceCardProps) {
  const style = accentStyles[accentColor] || accentStyles.blue;

  return (
    <div
      className={`section-fade-in group relative bg-white rounded-2xl border ${style.border} p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${style.glow}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`flex-shrink-0 w-11 h-11 ${style.icon} rounded-xl flex items-center justify-center shadow-lg`}>
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-900 leading-tight">{name}</h3>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-medium ${style.bg} ${style.text} mt-1`}>
            {port}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-500 mb-4">{description}</p>

      {/* Features */}
      <ul className="space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
            <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ServiceCard;
