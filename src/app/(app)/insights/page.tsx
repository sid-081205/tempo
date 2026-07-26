import { getInsights } from "@/lib/mock";
import { getGmailProposals, proposalToInsight } from "@/lib/gmail";
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

export default async function InsightsPage() {
  const proposals = await getGmailProposals();
  const insights: Insight[] = [
    ...proposals.map(proposalToInsight),
    ...getInsights(),
  ];

  return (
    <div>
      <div className="rise rise-1 mb-10">
        <p className="eyebrow mb-3 text-accent-deep">Insights</p>
        <h1 className="mb-3 text-4xl font-medium tracking-tight sm:text-5xl">
          What your schedule is doing{" "}
          <span className="italic text-accent-deep">to your body.</span>
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-ink/70">
          Every line pairs a physiological signal with the life context that
          explains it. Press one to open it up.
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
                {cards.map((ins: Insight, j) => (
                  <InsightCard
                    key={ins.id}
                    insight={ins}
                    nudgeDelay={(i * 3 + j) * 900}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="rise rise-5 mt-12 flex items-center justify-center gap-2 text-center text-xs text-ink/45">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-deep/70" />
        </span>
        Insights refresh with every big signal. Notifications are on.
      </p>
    </div>
  );
}
