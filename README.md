# Tempo (product app)

Your schedule affects your health. We show you how.

This branch (`app`) is the **iPhone-first product** — Pulse, Calendar, Insights, Chat, Settings — with a bottom tab bar and native Apple Health / Calendar hooks for the iOS shell.

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

Without Supabase keys the app opens locally (no auth wall). Connect **Apple Health** and **Apple Calendar** from Settings — they use the on-device bridge when running inside the iOS shell.

## Env

See `.env.example`:

- **Supabase** — auth + DB (optional)
- **OpenAI** — chat + Gmail intelligence
- **Composio** — Google Calendar, Gmail, Slack, Notion, WHOOP, Fitbit, Strava, Oura

## Stack

Next.js (App Router) · Tailwind v4 · Supabase · OpenAI · Composio · Capacitor (ios branch)
