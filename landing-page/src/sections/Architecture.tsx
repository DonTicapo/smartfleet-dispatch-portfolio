import ServiceCard from '../components/ServiceCard';

const services = [
  {
    name: 'Order Ticket Load Core',
    port: ':3000',
    description: 'Canonical domain model — the heart of the dispatch lifecycle.',
    features: [
      'Order → Ticket → Load lifecycle',
      'Delivery event ledger',
      'Canonical domain model',
      '60 source files',
    ],
    accentColor: 'blue',
    iconPath: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  },
  {
    name: 'Navixy Telematics Bridge',
    port: ':3001',
    description: 'GPS tracker integration with intelligent geofence inference.',
    features: [
      'GPS tracker sync',
      'Geofence inference engine',
      'Store-and-forward queue',
      '44 source files',
    ],
    accentColor: 'green',
    iconPath: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
  },
  {
    name: 'Dispatch Control Tower',
    port: ':3002',
    description: 'Central hub for truck assignment and exception management.',
    features: [
      'Truck/driver assignment',
      'Exception lifecycle',
      'Materialized dispatch board',
      '44 source files',
    ],
    accentColor: 'amber',
    iconPath: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
  },
  {
    name: 'Customer Visibility Portal',
    port: ':3003',
    description: 'Customer-facing dashboard with real-time delivery tracking.',
    features: [
      'Customer-scoped auth',
      'Real-time WebSocket tracking',
      'React dashboard + portal',
      '52 source files',
    ],
    accentColor: 'purple',
    iconPath: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    name: 'Analytics Integration Hub',
    port: ':3004',
    description: 'SAP B1 sync engine, analytics, and webhook delivery.',
    features: [
      'SAP mirror sync (4,800+ customers)',
      'Idempotent event store',
      'KPI computation + ERP export',
      '55 source files',
    ],
    accentColor: 'red',
    iconPath: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  },
  {
    name: 'Plant Edge OT Bridge',
    port: ':3005',
    description: 'Batch plant integration with offline-capable state machine.',
    features: [
      'Mixer state machine',
      'Scale tolerance checking',
      'Offline store-and-forward',
      '61 source files',
    ],
    accentColor: 'teal',
    iconPath: 'M11.42 15.17l-5.384-3.028A1.5 1.5 0 005.027 13.5H4.5a1.5 1.5 0 00-1.5 1.5v1.5a1.5 1.5 0 001.5 1.5h1.5a1.5 1.5 0 001.027-.398l5.384-3.028m0 0l5.384 3.028A1.5 1.5 0 0018.973 18H19.5a1.5 1.5 0 001.5-1.5V15a1.5 1.5 0 00-1.5-1.5h-.527a1.5 1.5 0 00-1.027.398l-5.384 3.028M11.42 15.17V8.83m0 0l5.384-3.028A1.5 1.5 0 0118.973 6H19.5A1.5 1.5 0 0021 4.5V3a1.5 1.5 0 00-1.5-1.5h-.527a1.5 1.5 0 00-1.027.398L12.562 4.926M11.42 8.83L6.036 5.802A1.5 1.5 0 005.027 5.5H4.5A1.5 1.5 0 003 4V2.5A1.5 1.5 0 014.5 1h.527a1.5 1.5 0 011.027.398l5.384 3.028',
  },
];

function Architecture() {
  return (
    <section id="architecture" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16 section-fade-in">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-slate-100 text-slate-600 mb-4">
            System Design
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Microservice Architecture
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Six bounded contexts, each with its own database, domain model, and API surface.
            Loosely coupled, independently deployable.
          </p>
        </div>

        {/* Data flow diagram */}
        <div className="section-fade-in mb-16">
          <div className="relative max-w-4xl mx-auto">
            {/* Flow indicator */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs font-medium text-slate-600">Domain Core</span>
              </div>
              <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-slate-600">Integration</span>
              </div>
              <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-xs font-medium text-slate-600">Customer-Facing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Service grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <ServiceCard key={service.port} {...service} delay={i * 100} />
          ))}
        </div>

        {/* Connection lines hint */}
        <div className="section-fade-in mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-50 border border-slate-200">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            <span className="text-sm text-slate-500">
              Services communicate via REST APIs with correlation IDs for distributed tracing
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Architecture;
