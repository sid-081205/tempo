"use client";

import { useEffect, useState } from "react";
import type { JournalEntry } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

const FEELINGS = ["Drained", "Low", "Okay", "Good", "Great"];

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export function Journal({ authEnabled }: { authEnabled: boolean }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tempo:journal");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setEntries(JSON.parse(raw));
    } catch {
      // Corrupt store: start fresh.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("tempo:journal", JSON.stringify(entries));
  }, [entries, loaded]);

  function save() {
    if (!feeling && !note.trim()) return;
    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      feeling: feeling ?? "Okay",
      note: note.trim(),
    };
    setEntries((e) => [entry, ...e].slice(0, 50));
    setFeeling(null);
    setNote("");

    if (authEnabled) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        void supabase.from("checkins").insert({
          user_id: user.id,
          mood: FEELINGS.indexOf(entry.feeling) + 1 || 3,
          note: entry.note || null,
        });
      });
    }
  }

  return (
    <div>
      <p className="mb-4 text-[13px] leading-relaxed text-ink/60">
        Quick subjective logs cover what sensors miss. How you feel, and the
        things you want to do. Tempo folds these into the picture.
      </p>

      <div className="glass rounded-3xl p-5">
        <p className="mb-2.5 text-xs font-semibold text-ink/60">
          How do you feel right now?
        </p>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {FEELINGS.map((f) => (
            <button
              key={f}
              onClick={() => setFeeling(feeling === f ? null : f)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                feeling === f
                  ? "border-transparent bg-ink text-paper"
                  : "border-white/60 bg-white/40 text-ink/60"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything on your mind, or something you want to do…"
          rows={2}
          className="glass mb-3 w-full resize-none rounded-2xl px-4 py-3 text-sm text-ink outline-none focus:border-accent"
        />
        <button
          onClick={save}
          disabled={!feeling && !note.trim()}
          className="btn-ink px-5 py-2.5 text-xs disabled:opacity-40"
        >
          Log it
        </button>
      </div>

      {entries.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {entries.slice(0, 6).map((e) => (
            <li
              key={e.id}
              className="glass flex items-start justify-between gap-3 rounded-2xl px-4 py-3"
            >
              <div>
                <span className="text-xs font-semibold">{e.feeling}</span>
                {e.note && (
                  <p className="mt-0.5 text-[13px] leading-snug text-ink/70">
                    {e.note}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-[11px] text-ink/40">
                {timeAgo(e.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
