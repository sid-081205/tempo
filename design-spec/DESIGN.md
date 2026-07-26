# Tempo Design Spec

Everything needed to rebuild the Tempo look (waitlist site, app, decks) with the same fonts, colors, and feel. The palette is called **Butter × Blue**: buttery warm paper with a deep periwinkle blue accent.

---

## Brand

- **Name:** Tempo (always normal case: capital T only, never "TEMPO")
- **Slogan:** Your schedule affects your health. We show you how.
- **One-liner:** A personal AI agent that reads your calendar and health data, and tells you what your schedule is doing to your body.
- **Voice:** short, plain, direct. No em dashes. No emojis. Notifications read like a sharp friend, not an AI: "Bad sleep last night? You had 6 hours of meetings yesterday."

## Logo

The mark is three stacked pebble/calendar blobs (see `logo.svg`). Drawn as three ellipses on a 100×100 viewBox:

| Ellipse | cx | cy | rx | ry |
| ------- | -- | -- | -- | -- |
| Top     | 56 | 21 | 23 | 13 |
| Middle  | 52 | 50 | 33 | 14 |
| Bottom  | 50 | 82 | 42 | 16 |

- Fill with a single color (`currentColor` in code). Ink on paper backgrounds; paper/white when on ink.
- App-icon style tile: ink background, corner radius ~28% of tile size, logo at ~55% of tile width, paper-colored.
- Wordmark lockup: logo + "Tempo", Space Grotesk semibold, tracking tight, gap ≈ 0.4× logo height.

## Typography

**One family everywhere: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk)** (Google Fonts, weights 300–700). No second font.

| Role | Weight | Size (web) | Notes |
| ---- | ------ | ---------- | ----- |
| Hero headline | 500 (medium) | 48–72px, line-height 1.02, letter-spacing tight | Slogan emphasis span is *italic* + accent color |
| Section heading | 500 | 36–48px | |
| Body | 400 | 16–18px, line-height 1.6 | Color ink at 70% opacity |
| Eyebrow / label | 500 | 12px, uppercase, letter-spacing 0.3em | Accent-deep or ink at 45% |
| Button | 600 | 14–16px | |
| Notification title | 600 | 13px | |
| Notification body | 400 | 13px, line-height snug | |

Note: Space Grotesk has no true italic; the browser synthesizes an oblique. On iOS, apply a skew or use the variable font's slant if needed. Closest system fallback: SF Pro with tight tracking.

## Colors (Butter × Blue)

Derived from two hues: paper hue 55 (butter), accent hue 228 (blue).

| Token | HSL | Hex (approx) | Use |
| ----- | --- | ------------ | --- |
| paper | `hsl(55 42% 93%)` | `#F5F3E6` | Page/app background |
| paper-deep | `hsl(55 36% 87%)` | `#EAE8D2` | Alternate section background |
| ink | `hsl(55 24% 15%)` | `#2F2E1D` | Text, black buttons, phone frame |
| muted | `hsl(55 12% 52%)` | `#939176` | Secondary text, placeholders |
| accent | `hsl(228 52% 46%)` | `#3851B2` | Accent text, focus states |
| accent-deep | `hsl(228 54% 36%)` | `#2A3E8D` | Italic headline emphasis, eyebrows |
| card | `hsl(55 45% 97%)` | `#FBFAF4` | Opaque cards |
| line | `hsl(55 24% 83%)` | `#DEDCC9` | Hairline borders |
| phone-a | `hsl(228 55% 84%)` | `#C0C9ED` | Phone wallpaper gradient start |
| phone-b | `hsl(228 50% 68%)` | `#8595D6` | Phone wallpaper gradient end |
| berry | `#A8506A` | `#A8506A` | Error text only |

Rules:

- Buttons are **always ink (black)** with paper text. Accent is for text emphasis and small details only, never button fills.
- Body copy: ink at 70% opacity. Fine print: ink at 50%.

## Backgrounds

Three layers, back to front:

1. **Paper:** flat `paper` color.
2. **Blobs:** three big blurred circles that drift slowly. `border-radius: 9999px; filter: blur(70px)`.
   - Blob A: `hsl(228 62% 70% / 0.45)` (~`#8396E2` at 45%), ~55vh diameter, top-left, drifts 26s
   - Blob B: `hsl(260 55% 62% / 0.32)` (~`#8C69D3` at 32%), ~65vh, top-right, drifts 32s
   - Blob C: `hsl(55 60% 82% / 0.6)` (~`#EDE8B6` at 60%), ~60vh, bottom-left, drifts 38s
   - Drift keyframes: translate ±4–6% of viewport and scale 0.92–1.12, ease-in-out, infinite.
3. **Grain:** SVG fractal noise overlay at 5% opacity over everything (paper texture). Web: `feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"` tiled at 240px. iOS: any subtle monochrome noise texture at 5% works.

## Glass (frosted) surfaces

Used for notification cards and the email input:

- Background: white at 40–45% opacity
- Border: 1px white at 55–60% opacity
- Backdrop blur: 16px (input) to 24px (notifications)
- Shadow: black at 10%, large soft radius

## Components

**Black pill button:** ink background, paper text, weight 600, fully rounded, padding 20px×12px. Hover: 85% opacity. Never accent-filled.

**Email input:** glass (above), fully rounded, ink text, muted placeholder. Focus: border becomes accent.

**iOS notification card:** glass card, corner radius 24px, padding 14px. Left: 36px app-icon tile (ink, radius 10px, paper logo inside). Title "Tempo" 13px/600, "now" timestamp 11px at 40% black, body 13px at 75% black. Entrance: spring drop, ~0.75s: starts 34px above at 88% scale, overshoots 5px down / 102%, settles. Easing `cubic-bezier(0.34, 1.4, 0.44, 1)`.

**Phone mock:** frame is ink-ish `#2B2823`, 10px border, corner radius ~51px, dynamic island pill 92×26px. Screen: linear-gradient 160° from phone-a to phone-b. Lock screen clock: date 14px/500, time 60px/600 tight, black at 75%. The phone idle-floats: translateY ±10px over 7s.

**Marquee:** integration names in 24–30px/500 at 60% ink, 4.5rem gaps, 30s linear infinite loop, edges masked with a 12% fade. Names: Apple Health, Google Calendar, WHOOP, Oura, Gmail, Slack, Strava, Notion, Fitbit, Outlook.

## Motion

- **Entrances:** fade + rise 22px, 0.8s, `cubic-bezier(0.22, 1, 0.36, 1)`, staggered ~130ms apart.
- **Scroll reveals:** same curve, triggered at 15% visibility, once.
- **Notification cycle:** new notification every 4.2s, max 2 visible, oldest drops off.
- Respect reduced-motion: disable all of the above.

## Copy bank (notifications)

- "Calls with your mom drop your heart rate 6 bpm. It's been two weeks. Find a slot?"
- "This invite will cost you 40 minutes of elevated heart rate. Add a break after?"
- "Bad sleep last night? You had 6 hours of meetings yesterday."
- "Your energy dips around your 4pm sync. Move it?"

## Infrastructure (waitlist)

- Web: Next.js 16 + Tailwind v4, deployed on Vercel (`tempo-inky-iota.vercel.app`, project `siddy-s-projects/tempo`).
- Waitlist DB: Turso, database `tempo-waitlist`, table `waitlist(id, email UNIQUE, created_at)`.
- Env vars: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (in `.env.local` locally and Vercel project settings).
- Check signups: `turso db shell tempo-waitlist "SELECT * FROM waitlist"`
