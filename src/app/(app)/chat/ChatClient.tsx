"use client";

import { useEffect, useRef, useState } from "react";
import { LogoTile } from "@/components/Logo";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Why did I sleep badly?",
  "What's on my calendar this week?",
  "Anything in my email I should act on?",
  "Schedule a call with Sam Sunday 5pm",
];

const OPENER: Message = {
  role: "assistant",
  content:
    "I read your calendar, your email, and your health data. I can explain why your body looks the way it does, and I can act: list your real events, dig through recent mail, put things on your calendar. Ask me anything.",
};

export function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([OPENER]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    const next: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(1) }),
      });
      const data = (await res.json()) as { reply?: string };
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply ?? "Something went sideways. Try again?",
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I couldn't reach my brain. Try again?" },
      ]);
    } finally {
      setThinking(false);
    }
  }

  const showSuggestions = messages.length === 1;

  return (
    <div className="mx-auto flex h-[calc(100dvh-8.5rem)] min-h-[380px] max-w-lg flex-col">
      <div className="mb-4 shrink-0 text-center">
        <p className="eyebrow mb-2 text-accent-deep">Tempo</p>
        <h1 className="text-3xl font-medium tracking-tight">
          Ask <span className="italic text-accent-deep">why.</span>
        </h1>
      </div>

      <div
        ref={scrollRef}
        className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-1 pb-2"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-end gap-2.5 ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.role === "assistant" && (
              <LogoTile size={30} className="mb-1 shrink-0" />
            )}
            <div
              className={`max-w-[80%] rounded-3xl px-5 py-3.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-lg bg-ink text-paper"
                  : "glass-strong rounded-bl-lg text-ink/85"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex items-end gap-2.5">
            <LogoTile size={30} className="mb-1 shrink-0" />
            <div className="glass-strong rounded-3xl rounded-bl-lg px-5 py-3.5 text-sm text-ink/45">
              Thinking…
            </div>
          </div>
        )}

        {showSuggestions && (
          <div className="flex flex-wrap justify-center gap-2 pt-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="glass rounded-full px-4 py-2.5 text-[13px] font-medium text-ink/70"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 shrink-0"
      >
        <div className="glass-strong flex items-center gap-2 rounded-full p-2 pl-5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask why, or ask me to do something…"
            className="flex-1 bg-transparent text-sm text-ink outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            className="btn-ink px-5 py-2.5 text-sm disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
