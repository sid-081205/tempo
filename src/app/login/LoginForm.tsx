"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return;
    setError(null);
    setNotice(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setNotice("Check your email to confirm your account.");
        setLoading(false);
      }
    }
  }

  if (!configured) {
    return (
      <div className="glass-strong rounded-3xl p-7 text-center">
        <p className="mb-1 text-sm font-semibold">Demo mode</p>
        <p className="mb-6 text-sm leading-relaxed text-ink/60">
          Supabase isn&apos;t configured yet. Add{" "}
          <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to
          enable real accounts. Until then, walk straight in.
        </p>
        <button
          onClick={() => router.push("/")}
          className="btn-ink w-full px-5 py-3 text-sm"
        >
          Enter Tempo
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass-strong rounded-3xl p-7">
      <div className="mb-6 flex rounded-full bg-white/35 p-1 text-sm font-medium">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
              setNotice(null);
            }}
            className={`flex-1 rounded-full px-4 py-2 transition-all duration-300 ${
              mode === m ? "bg-white text-accent shadow-sm" : "text-ink/55"
            }`}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <label className="mb-1.5 block text-xs font-medium text-ink/60">
        Email
      </label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="glass mb-4 w-full rounded-full px-5 py-3 text-sm text-ink outline-none transition-colors focus:border-accent"
      />

      <label className="mb-1.5 block text-xs font-medium text-ink/60">
        Password
      </label>
      <input
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        className="glass mb-6 w-full rounded-full px-5 py-3 text-sm text-ink outline-none transition-colors focus:border-accent"
      />

      {error && <p className="mb-4 text-sm text-berry">{error}</p>}
      {notice && <p className="mb-4 text-sm text-accent-deep">{notice}</p>}

      <button
        type="submit"
        disabled={loading}
        className="btn-ink w-full px-5 py-3 text-sm disabled:opacity-60"
      >
        {loading
          ? "One moment"
          : mode === "signin"
            ? "Sign in"
            : "Create account"}
      </button>
    </form>
  );
}
