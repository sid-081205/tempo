import type { CSSProperties } from "react";

export function Logo({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <ellipse cx="56" cy="21" rx="23" ry="13" />
      <ellipse cx="52" cy="50" rx="33" ry="14" />
      <ellipse cx="50" cy="82" rx="42" ry="16" />
    </svg>
  );
}

export function LogoTile({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center bg-ink text-paper ${className}`}
      style={{ width: size, height: size, borderRadius: size * 0.28 }}
    >
      <Logo className="text-paper" style={{ width: size * 0.55 }} />
    </div>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Logo className="h-[1.15em] w-[1.15em]" />
      <span className="font-semibold tracking-tight">Tempo</span>
    </span>
  );
}
