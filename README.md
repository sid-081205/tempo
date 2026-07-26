# Tempo (iPhone)

This branch (`ios`) wraps the product app in a native iOS shell (Capacitor).

## Branches

| Branch | What it is |
|--------|------------|
| `main` | Marketing site + waitlist |
| `app` | Product web app |
| `ios` | iPhone shell (you are here) |
| `design` | Design reference photos |

## Quick start

```bash
git checkout ios
npm install
cp .env.example .env.local   # same keys as the app branch
npm run dev                  # leave running
npm run ios:open             # opens Xcode
```

Full simulator / physical device / production steps: **[README-IOS.md](README-IOS.md)**.
