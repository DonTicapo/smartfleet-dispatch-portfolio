import FeatureCard from '../components/FeatureCard';

const features = [
  {
    title: 'Domain-Driven Design',
    description:
      'Bounded contexts with entities as interfaces, value objects, and domain-specific error types. Each service owns its ubiquitous language.',
    iconPath:
      'M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25',
  },
  {
    title: 'Event-Driven Architecture',
    description:
      'Idempotent event ingestion, store-and-forward queues, and HMAC-signed webhook delivery ensure reliable cross-service communication.',
    iconPath:
      'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
  },
  {
    title: 'Real-Time Tracking',
    description:
      'WebSocket-based live load tracking with automatic graceful polling fallback. Customers see mixer trucks moving on a real-time map.',
    iconPath:
      'M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
  },
  {
    title: 'Security First',
    description:
      'JWT authentication, customer-scoped access control, CORS policies, rate limiting, and comprehensive audit logging across all services.',
    iconPath:
      'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  },
  {
    title: 'Full Observability',
    description:
      'Request and correlation IDs propagated across services, structured JSON logging, and cross-service distributed tracing for debugging.',
    iconPath:
      'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605',
  },
  {
    title: 'Developer Experience',
    description:
      'OpenAPI/Swagger docs on every service, Bruno API collections, unified npm scripts, and full Docker Compose orchestration.',
    iconPath:
      'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5',
  },
];

function Features() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16 section-fade-in">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-slate-200 text-slate-600 mb-4">
            Engineering
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Production-Ready Patterns
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Every service follows consistent patterns designed for maintainability, reliability, and
            real-world operational demands.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} {...feature} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
