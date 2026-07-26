# Tempo (product app)

Your schedule affects your health. We show you how.

This branch (`app`) is the **product web app** — login, Pulse, Calendar, Insights, Chat, Settings.

## Branches

| Branch | What it is |
|--------|------------|
| `main` | Marketing site + waitlist |
| `app` | Product web app (you are here) |
| `ios` | iPhone shell wrapping this app |
| `design` | Design reference photos |

## Run

```bash
git checkout app
npm install
cp .env.example .env.local   # fill in keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

With no env vars the app runs in **demo mode** (mock data, no auth wall).

Test account (when Supabase is configured): `sid@tempo.health` / `tempo-demo-2026`.

## Env

See `.env.example`:

- **Supabase** — auth + DB
- **OpenAI** — chat (optional; falls back to built-in engine)
- **Composio** — Google Calendar, Gmail, and other connectors

## Stack

Next.js (App Router) · Tailwind v4 · Supabase · OpenAI · Composio · Vercel
