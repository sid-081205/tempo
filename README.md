# Tempo

Your schedule affects your health. We show you how.

This branch (`main`) is the **marketing site and waitlist**.

## Branches

| Branch | What it is |
|--------|------------|
| `main` | Marketing site + waitlist (you are here) |
| `app` | Product web app (login, Pulse, Calendar, Chat, Insights) |
| `ios` | iPhone shell (Capacitor) wrapping the product |
| `design` | Whiteboard / design reference photos |

## Run

```bash
git clone https://github.com/sid-081205/tempo.git
cd tempo
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional: copy `.env.example` → `.env.local` and add Turso credentials for a hosted waitlist DB. Without them, signups go to a local `waitlist.db`.

## Product app

```bash
git checkout app
npm install
cp .env.example .env.local   # fill in keys
npm run dev
```

## iPhone

```bash
git checkout ios
# see README-IOS.md
```
