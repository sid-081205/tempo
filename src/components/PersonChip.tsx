"use client";

import { PEOPLE } from "@/lib/mock";

export function PersonChip({ personId }: { personId: string }) {
  const person = PEOPLE.find((p) => p.id === personId);
  if (!person) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/45 py-1 pl-1 pr-2.5 text-xs font-medium text-ink/75">
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white"
        style={{ background: `hsl(${person.hue} 40% 55%)` }}
      >
        {person.name.charAt(0)}
      </span>
      {person.name}
    </span>
  );
}
