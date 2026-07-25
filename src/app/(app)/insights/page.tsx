import { getInsights } from "@/lib/mock";
import type { Insight, InsightCategory } from "@/lib/types";
import { InsightCard } from "./InsightCard";

export const dynamic = "force-dynamic";

const CATEGORIES: { id: InsightCategory; label: string; blurb: string }[] = [
  {
    id: "trends",
    label: "General medical trends",
    blurb: "What your body has been doing lately.",
  },
  {
    id: "schedule",
    label: "Schedule related",
    blurb: "Where your calendar shows up in your data.",
  },
  {
    id: "future",
    label: "Changes to the future",
    blurb: "What Tempo would change, with your permission.",
  },
];

export default function InsightsPage() {
  const insights = getInsights();

  return (
    <div>
      <div className="rise rise-1 mb-10">
        <p className="eyebrow mb-3 text-accent-deep">Insights</p>
        <h1 className="mb-3 text-4xl font-medium tracking-tight sm:text-5xl">
          What your schedule is doing{" "}
          <span className="italic text-accent-deep">to your body.</span>
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-ink/70">
          Every card pairs a physiological signal with the life context that
          explains it. State and context, side by side.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3 md:gap-5">
        {CATEGORIES.map((cat, i) => {
          const cards = insights.filter((ins) => ins.category === cat.id);
          return (
            <section key={cat.id} className={`rise rise-${i + 2}`}>
              <div className="mb-4 px-1">
                <h2 className="text-sm font-semibold">{cat.label}</h2>
                <p className="text-xs text-ink/50">{cat.blurb}</p>
              </div>
              <div className="flex flex-col gap-4">
                {cards.map((ins: Insight) => (
                  <InsightCard key={ins.id} insight={ins} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
