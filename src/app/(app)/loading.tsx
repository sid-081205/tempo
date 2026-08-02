export default function Loading() {
  return (
    <div className="space-y-4 pt-2" aria-busy="true" aria-label="Loading">
      <div className="h-3 w-24 rounded-full bg-ink/8" />
      <div className="h-9 w-48 rounded-2xl bg-ink/10" />
      <div className="h-4 w-full max-w-sm rounded-full bg-ink/6" />
      <div className="mt-6 flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 w-24 shrink-0 rounded-full bg-white/50" />
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-3xl bg-white/55" />
        ))}
      </div>
    </div>
  );
}
