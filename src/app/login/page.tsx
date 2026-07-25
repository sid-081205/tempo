import { Background } from "@/components/Background";
import { Logo } from "@/components/Logo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <Background />

      <div className="rise rise-1 mb-10 flex flex-col items-center text-center">
        <div className="mb-6 flex items-center gap-3">
          <Logo className="h-9 w-9 text-ink" />
          <span className="text-3xl font-semibold tracking-tight">Tempo</span>
        </div>
        <h1 className="max-w-md text-balance text-2xl font-medium leading-tight tracking-tight text-ink/90">
          Your schedule affects your health.{" "}
          <span className="italic text-accent-deep">We show you how.</span>
        </h1>
      </div>

      <div className="rise rise-2 w-full max-w-sm">
        <LoginForm configured={isSupabaseConfigured} />
      </div>

      <p className="rise rise-3 mt-8 max-w-xs text-center text-xs leading-relaxed text-ink/50">
        A personal AI agent that reads your calendar and health data, and tells
        you what your schedule is doing to your body.
      </p>
    </main>
  );
}
