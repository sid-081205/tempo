"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const TABS = [
  { href: "/", label: "Pulse" },
  { href: "/insights", label: "Insights" },
  { href: "/calendar", label: "Calendar" },
  { href: "/chat", label: "Chat" },
  { href: "/settings", label: "Settings" },
];

export function Nav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-4 z-40 px-4">
      <div className="glass-strong mx-auto flex max-w-5xl items-center justify-between rounded-full py-2 pl-5 pr-2">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-5 w-5 text-ink" />
          <span className="text-lg font-semibold tracking-tight">Tempo</span>
        </Link>

        <nav className="flex items-center gap-0.5 text-sm font-medium">
          {TABS.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-full px-3.5 py-2 transition-all duration-300 sm:px-4 ${
                  active
                    ? "bg-white text-accent shadow-sm"
                    : "text-ink/60 hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div
          className="ml-2 hidden h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper sm:flex"
          title={userName}
        >
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
