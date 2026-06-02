# Practice5 — UI/UX Upgrade Design

**Date:** 2026-06-02  
**Scope:** Full app — student + teacher + auth  
**Goal:** Replace the current light/emoji-based UI with a sophisticated dark-gold design using Rubik font, Lucide SVG icons, and an animated music-wave background.

---

## Design Language

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `brand-dark` | `#0f0f0f` | Page background |
| `brand-surface` | `#1a1a1a` | Cards, inputs, nav |
| `brand-surface-2` | `#111111` | Inactive items, secondary bg |
| `brand-border` | `#222222` | Borders |
| `brand-gold` | `#c9a84c` | Primary accent — XP, active states, CTAs |
| `brand-gold-light` | `#e8c96d` | Gradient endpoint, alternating wave bars |
| `brand-text` | `#ffffff` | Primary text |
| `brand-muted` | `#666666` | Secondary text |
| `brand-faint` | `#333333` | Inactive text |

All existing `brand-red` references are replaced. The new primary action color is `brand-gold`.

### Typography

- **Font:** [Rubik](https://fonts.google.com/specimen/Rubik) — loaded via `next/font/google`
- **Weights used:** 400 (body), 600 (labels), 700 (subheadings), 800 (headings, CTAs)
- Applied globally via `app/layout.tsx` className on `<body>`

### Icons

- **Library:** [Lucide React](https://lucide.dev) (`lucide-react` npm package)
- **Style:** stroke-only, `strokeWidth={1.5}`, size 20–22px
- **No emojis anywhere in the app**
- Icon mapping:
  - קריאת תווים → `Music` (note + staff icon)
  - מקצבים → `Activity` (waveform)
  - סולמות → `Layers` (stacked layers)
  - ניווט בית → `Home`
  - ניווט פרופיל → `User`
  - ניווט תלמידים (מורה) → `Users`
  - יציאה → `LogOut`
  - חץ חזרה → `ChevronRight` (RTL)

---

## Background Animation

**Component:** `components/shared/WaveBackground.tsx`  
**Type:** CSS-only animated equalizer bars (no canvas, no JS animation)  
**Used on:** `app/(student)/practice/page.tsx`, `app/(teacher)/dashboard/page.tsx`

### Spec
- 20 vertical bars, widths 3–4px, `border-radius: 3px 3px 0 0`
- Positioned absolutely at bottom of the page, behind all content
- Each bar animates between `4px` and its target height via `@keyframes wave-bar` (`ease-in-out`, `alternate`, `infinite`)
- Bar color: `linear-gradient(to top, #c9a84c, transparent)`
- Every even bar: `linear-gradient(to top, #e8c96d, transparent)` (subtle variation)
- Overall opacity: `0.55`
- Durations: 0.6s–1.4s, staggered delays 0s–0.45s
- The page content sits above the animation via `position: relative; z-index: 1`

---

## File Map

| File | Change |
|------|--------|
| `app/globals.css` | New `@theme` color tokens, remove old brand-red, add body bg |
| `app/layout.tsx` | Load Rubik via `next/font/google`, apply to body |
| `components/shared/WaveBackground.tsx` | New — animated wave component |
| `components/student/BottomNav.tsx` | Replace emojis → Lucide `Home` + `User` icons |
| `components/student/TimeSkillSelector.tsx` | Dark cards, Lucide skill icons, gold active state |
| `components/student/XPBar.tsx` | Gold gradient bar on dark background |
| `components/student/WeeklyProgress.tsx` | Gold dots for practiced days, dark empty dots |
| `components/student/ExerciseCard.tsx` | Dark card wrapper for exercise content |
| `components/student/MusicNotation.tsx` | Add `filter: invert(1) brightness(1.8)` to abcjs container |
| `components/student/NoteAnswer.tsx` | Dark reveal button, dark self-assessment |
| `components/student/RhythmNotation.tsx` | Same filter treatment as MusicNotation |
| `components/student/AchievementBadge.tsx` | Dark locked/unlocked states, gold for earned |
| `app/(student)/practice/page.tsx` | Dark header, add WaveBackground |
| `app/(student)/practice/exercise/page.tsx` | Dark header, dark layout |
| `app/(student)/practice/complete/page.tsx` | Dark bg, trophy as gold-border circle with ★, dark XP badge |
| `app/(student)/layout.tsx` | Dark background |
| `app/(auth)/login/page.tsx` | Dark form, gold CTA button |
| `app/(auth)/register/page.tsx` | Dark form, gold CTA button |
| `components/teacher/BottomNav.tsx` | Replace 👥 emoji → Lucide `Users` icon |
| `components/teacher/StudentCard.tsx` | Dark card, gold session count |
| `components/teacher/TeacherStats.tsx` | Dark stat cards |
| `app/(teacher)/dashboard/page.tsx` | Dark header, add WaveBackground |
| `app/(teacher)/layout.tsx` | Dark background |

---

## Screen-by-Screen Breakdown

### Auth (Login + Register)
- Full-screen dark background `#0f0f0f`
- Centered card with `background: #1a1a1a`, `border: 1px solid #222`, `border-radius: 24px`
- Logo/brand text in gold at top
- Input fields: `background: #111`, `border: 1px solid #222`, white text, gold focus ring
- Primary button: `background: #c9a84c`, black text, `font-weight: 700`
- Secondary links: `color: #666`

### Student — דף הבית (`/practice`)
- `WaveBackground` behind everything
- Dark header: brand label in gold (letter-spacing), greeting + name in white, avatar circle in gold
- XP bar: gold gradient fill on `#1e1e1e` track
- Weekly progress: gold filled circles for practiced days, `#1a1a1a` + border for empty
- TimeSkillSelector: dark card, each skill row has Lucide icon + label, active = gold border + white text, inactive = `#333` text; time buttons same treatment; CTA = full-width gold button

### Student — עמוד תרגיל (`/practice/exercise`)
- Dark header with `ChevronRight` back arrow (RTL), title + duration
- Music notation container: `background: #1a1a1a`, `border-radius: 12px`, inner abcjs div gets `filter: invert(1) brightness(1.8)` so black-on-white becomes white-on-dark
- Instruction text: `#666`
- Reveal answer button: `background: #111`, `border: 1px solid #222`, gold text on hover
- Self-assessment buttons (after reveal): dark bordered options, gold for correct
- Finish CTA: full-width gold button

### Student — מסך סיום (`/practice/complete`)
- Dark full-screen, centered card `#1a1a1a`
- Trophy: circle `border: 1px solid #c9a84c`, `★` symbol in gold (no emoji)
- Title in white, subtitle in `#666`
- XP badge: `background: #111`, `border: 1px solid #c9a84c`, XP amount in gold
- Stats row (duration + level): two-column on dark bg
- CTA: gold button

### Student — פרופיל (`/profile`)
- Dark header with avatar (gold circle, initial letter), name + level
- XP bar same as home
- Stats grid: dark cards, gold numbers
- Achievement cabinet: dark cards, gold border + gold icon for earned, `#333` for locked
- Logout: subtle dark bordered button with `LogOut` icon

### Teacher — דשבורד (`/dashboard`)
- `WaveBackground` behind everything
- Dark header: brand label, teacher name, logout button with `LogOut` icon
- Stats: three dark cards, gold numbers for today/week
- Student list: dark `StudentCard` rows — avatar circle (gold if practiced today, dark otherwise), name + last session info, gold session count
- BottomNav: `Users` Lucide icon, gold when active

---

## Music Notation — Dark Mode Strategy

abcjs renders an SVG with black lines on white background. To make it work on dark:

```css
.notation-container svg {
  filter: invert(1) brightness(1.8);
}
```

The `invert(1)` turns black→white and white→black. `brightness(1.8)` compensates for the slight gray tint. The container background becomes `#1a1a1a` so the inverted white background becomes the card color naturally.

---

## Non-Goals

- No changes to data fetching or Supabase queries
- No changes to gamification logic
- No new routes or pages
- No changes to abcjs rendering logic — only CSS filter applied to output
- No dark/light mode toggle — dark only
