"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "done" | "error";

export default function WaitlistForm({
  buttonLabel = "Join the waitlist",
  pill = false,
}: {
  buttonLabel?: string;
  pill?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const radius = pill ? "rounded-full" : "rounded-xl";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setStatus("done");
      setMessage(
        data.already
          ? "You're already on the list. See you soon."
          : "You're in. We'll write when it's ready."
      );
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  if (status === "done") {
    return (
      <p className="text-accent-deep text-lg font-medium py-3">{message}</p>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={`w-full sm:flex-1 ${radius} border border-white/60 bg-white/40 backdrop-blur-md px-4 py-3 text-base text-ink placeholder:text-muted focus:outline-none focus:border-accent transition-colors`}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={`w-full sm:w-auto ${radius} bg-ink px-5 py-3 text-base font-semibold text-paper hover:opacity-85 transition-opacity disabled:opacity-60 whitespace-nowrap cursor-pointer`}
        >
          {status === "loading" ? "Joining…" : buttonLabel}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-sm text-berry">{message}</p>
      )}
    </form>
  );
}
