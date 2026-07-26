import PhoneMock from "@/components/PhoneMock";
import Reveal from "@/components/Reveal";
import WaitlistForm from "@/components/WaitlistForm";
import TempoLogo from "@/components/TempoLogo";
import SignUpButton from "@/components/SignUpButton";

const INTEGRATIONS = [
  "Apple Health",
  "Google Calendar",
  "WHOOP",
  "Oura",
  "Gmail",
  "Slack",
  "Strava",
  "Notion",
  "Fitbit",
  "Outlook",
];

export default function Home() {
  return (
    <div className="grain relative min-h-screen overflow-hidden bg-paper text-ink">
      {/* painterly blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="blob blob-a -left-24 -top-32 h-[420px] w-[420px] bg-[var(--blob-a)]" />
        <div className="blob blob-b -right-36 top-[280px] h-[520px] w-[520px] bg-[var(--blob-b)]" />
        <div className="blob blob-c -bottom-40 left-[12%] h-[460px] w-[460px] bg-[var(--blob-c)]" />
      </div>

      <div className="relative">
      {/* header */}
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="flex items-center gap-2.5 text-xl font-semibold tracking-tight">
            <TempoLogo className="h-6 w-6 text-ink" />
            Tempo
          </span>
          <SignUpButton />
        </header>

        {/* split hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-8 sm:pb-24 lg:grid-cols-2 lg:gap-14 lg:pt-16">
          <div>
            <p className="rise rise-1 text-xs font-medium uppercase tracking-[0.3em] text-accent-deep">
              Your schedule × your body
            </p>
            <h1 className="rise rise-2 mt-5 text-[2.6rem] font-medium leading-[1.05] tracking-tight sm:text-6xl sm:leading-[1.02] lg:text-7xl">
              Your schedule affects your health.{" "}
              <span className="italic text-accent-deep">
                We show you how.
              </span>
            </h1>
            <p className="rise rise-3 mt-6 max-w-md text-lg leading-relaxed text-ink/70">
              Your wearable says your HRV is down. Tempo says it&apos;s the
              five hours of back-to-back meetings, and tells you before you
              accept the next one.
            </p>
            <div id="join" className="rise rise-4 mt-8">
              <WaitlistForm pill buttonLabel="Join waitlist" />
            </div>
          </div>
          <div className="rise rise-4 flex justify-center lg:justify-end">
            <PhoneMock tilt={4} />
          </div>
        </section>

        {/* integrations marquee */}
        <section className="py-16 sm:py-20">
          <Reveal>
            <p className="text-center text-xs font-medium uppercase tracking-[0.3em] text-ink/45">
              It connects with
            </p>
          </Reveal>
          <div className="marquee mt-8">
            <div className="marquee-track">
              {[...INTEGRATIONS, ...INTEGRATIONS].map((name, i) => (
                <span
                  key={i}
                  className="text-2xl font-medium text-ink/60 sm:text-3xl"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* footer cta */}
        <footer className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-24">
          <Reveal>
            <h2 className="text-3xl font-medium tracking-tight sm:text-5xl">
              Your body keeps the score.
              <br />
              <span className="italic text-accent-deep">
                Tempo reads it back to you.
              </span>
            </h2>
            <div className="mt-9 flex justify-center">
              <WaitlistForm pill buttonLabel="Get early access" />
            </div>
            <p className="mt-16 text-sm text-ink/50">
              © {new Date().getFullYear()} Tempo
            </p>
          </Reveal>
        </footer>
      </div>
    </div>
  );
}
