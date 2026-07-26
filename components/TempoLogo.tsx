export default function TempoLogo({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <ellipse cx="56" cy="21" rx="23" ry="13" fill="currentColor" />
      <ellipse cx="52" cy="50" rx="33" ry="14" fill="currentColor" />
      <ellipse cx="50" cy="82" rx="42" ry="16" fill="currentColor" />
    </svg>
  );
}
