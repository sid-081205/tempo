# Tempo

Your schedule affects your health. We show you how.

Tempo is a personal AI agent that reads your calendar and health data, and tells you what your schedule is doing to your body. **State ⟷ context:** every physiological signal, paired with the life context that explains it.

## Sections

- **Home** — heart rate with calendar events stacked on the graph (press one to see what it did to your body), HRV, sleep, energy, meeting load, and invite triage: the predicted bodily cost of a new invite before you accept it.
- **Insights** — three streams: general medical trends, schedule-related findings, and changes Tempo proposes for the future.
- **Calendar** — the master calendar, every event colored by what it does to you: restores, neutral, costs.
- **Chat** — ask why. Grounded in your data.
- **Settings** — account, the reactive⟷proactive autonomy dial, goals, connectors (MCP tools), and wearables.

## Stack

- [Next.js](https://nextjs.org) (App Router) + Tailwind CSS v4
- [Supabase](https://supabase.com) for auth and database
- OpenAI for chat (optional)
- Deploys on Vercel

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

With no env vars the app runs in **demo mode**: no auth wall, a stand-in user, and a deterministic mock data engine that generates realistic heart rate, HRV, sleep, and calendar data. Perfect for demos.

## Enabling real auth (Supabase)

1. Create a Supabase project.
2. Run the migration in `supabase/migrations/0001_init.sql` (SQL editor or `supabase db push`).
3. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).

## Enabling real chat (OpenAI)

Set `OPENAI_API_KEY` in `.env.local`. Model defaults to `gpt-4o-mini` (cheap); override with `OPENAI_MODEL`. Without a key, chat falls back to a built-in engine grounded in the demo data, so the demo never breaks.

## Design

The look is **Butter × Blue**: buttery warm paper, deep periwinkle accent, Space Grotesk everywhere, frosted glass over slowly drifting blobs with a grain overlay. Tokens live in `src/app/globals.css`.
