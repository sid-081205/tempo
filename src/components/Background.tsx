export function Background() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          "radial-gradient(120% 80% at 10% -10%, hsl(228 55% 84% / 0.55), transparent 55%), radial-gradient(90% 70% at 100% 0%, hsl(228 50% 72% / 0.28), transparent 50%), radial-gradient(70% 50% at 50% 110%, hsl(55 50% 88% / 0.7), transparent 55%), var(--color-paper)",
      }}
    />
  );
}
