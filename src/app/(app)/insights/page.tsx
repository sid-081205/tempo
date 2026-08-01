import { getInsights } from "@/lib/mock";
import { getGmailProposals, proposalToInsight } from "@/lib/gmail";
import { withTimeout } from "@/lib/fast";
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
  // Never block Insights on a cold Gmail + LLM extraction.
  const proposals = await withTimeout(getGmailProposals(), 600, []);
  const insights: Insight[] = [
    ...proposals.map(proposalToInsight),
    ...getInsights(),
  ];

  return (
    <div>
      <div className="mb-8">
        <p className="eyebrow mb-3 text-accent-deep">Insights</p>
        <h1 className="mb-3 text-3xl font-medium tracking-tight sm:text-4xl">
          What your schedule is doing{" "}
          <span className="italic text-accent-deep">to your body.</span>
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-ink/70">
          Every line pairs a physiological signal with the life context that
          explains it. Press one to open it up.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {CATEGORIES.map((cat) => {
          const cards = insights.filter((ins) => ins.category === cat.id);
          return (
            <section key={cat.id}>
              <div className="mb-3 px-1">
                <h2 className="text-sm font-semibold">{cat.label}</h2>
                <p className="text-xs text-ink/50">{cat.blurb}</p>
              </div>
              <div className="flex flex-col gap-3">
                {cards.map((ins: Insight) => (
                  <InsightCard key={ins.id} insight={ins} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-ink/45">
        <span className="h-1.5 w-1.5 rounded-full bg-sage-deep/70" />
        Insights refresh with every big signal.
      </p>
    </div>
  );
}
