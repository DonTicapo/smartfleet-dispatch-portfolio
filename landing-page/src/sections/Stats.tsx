const stats = [
  { value: '6', label: 'Microservices' },
  { value: '4,800+', label: 'SAP Customers Synced' },
  { value: '291+', label: 'Passing Tests' },
  { value: '350+', label: 'TypeScript Files' },
  { value: '44', label: 'Database Tables' },
];

function Stats() {
  return (
    <section className="relative py-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16 section-fade-in">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-white/10 text-slate-400 mb-4">
            By the Numbers
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Project Scale
          </h2>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="section-fade-in text-center"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-slate-400 tracking-wide uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Stats;
