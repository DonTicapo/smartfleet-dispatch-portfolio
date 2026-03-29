const technologies = [
  { name: 'TypeScript', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Node.js 22', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'Fastify 5', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  { name: 'PostgreSQL 16', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { name: 'React 18', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { name: 'Tailwind CSS', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { name: 'Zod', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { name: 'Knex', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { name: 'Vitest', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { name: 'Docker', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'WebSocket', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'OpenAPI', color: 'bg-green-50 text-green-700 border-green-200' },
];

function TechStack() {
  return (
    <section className="py-12 bg-slate-50 border-y border-slate-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {technologies.map((tech) => (
            <span
              key={tech.name}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 hover:scale-105 hover:shadow-sm ${tech.color}`}
            >
              {tech.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TechStack;
