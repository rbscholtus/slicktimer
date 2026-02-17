# SlickTimer — Claude Code Guidelines

## Project overview

SlickTimer is a time-tracking PWA built with SvelteKit + Firebase. See SLICKTIMER.md for the full requirements, data model, and implementation overview.

## Tech stack

- **Frontend**: SvelteKit 2 + Svelte 5 (with runes). Custom Firebase wrappers (no SvelteFire — it's unmaintained).
- **Backend**: Firebase (Firestore, Auth, Hosting). Client SDK only — no `firebase-admin`.
- **Build**: Vite + `@sveltejs/adapter-static` (SPA mode, no SSR)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` plugin). Theme tokens defined via `@theme` in `src/app.css` — no `tailwind.config.js`.
- **PWA**: `@vite-pwa/sveltekit` with Workbox for offline caching and auto-updates.
- **Package manager**: npm

## Project structure

```
src/
  app.html                      # HTML shell
  app.css                       # Tailwind entry + @theme design tokens
  lib/
    firebase/
      config.ts                 # Firebase app init
      auth.svelte.ts            # Reactive auth state (runes)
      firestore.svelte.ts       # Reactive doc/collection wrappers (runes)
      types.ts                  # TypeScript interfaces for Firestore documents
    components/                 # Reusable Svelte components
    stores/                     # Rune-based state (.svelte.ts files)
    utils/                      # Pure utility functions (formatting, dates)
  routes/
    +layout.svelte              # Root layout (imports app.css only, no auth)
    +layout.ts                  # Disables SSR (ssr = false)
    +page.svelte                # Public Home page (no auth required)
    login/+page.svelte          # Login screen
    (app)/
      +layout.svelte            # Auth guard + Nav for authenticated pages
      timer/+page.svelte        # Main timer screen
      entries/+page.svelte      # Edit time entries
      reports/+page.svelte      # Reports (pivot table, timesheet)
static/                         # PWA icons, favicon
firestore.rules                 # Firestore security rules
firebase.json                   # Firebase Hosting config
.env                            # Firebase config (PUBLIC_ prefix)
```

## Code conventions

- Use Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) — never legacy `$:` reactive declarations or Svelte stores.
- Files that use runes at the module level use the `.svelte.ts` extension.
- Keep components small and focused. Prefer composition over large monolithic components.
- Firebase initialization and helpers live in `src/lib/firebase/`. Never import `firebase/*` directly from components — use the wrappers (`getUser()`, `useDoc()`, `useCollection()`).
- Firestore documents must match the data model in SLICKTIMER.md. TypeScript interfaces live in `src/lib/firebase/types.ts`.
- Style with Tailwind utility classes directly in markup. Avoid writing custom CSS unless Tailwind doesn't cover the case. Use `@apply` sparingly.
- Design tokens (colors, spacing) are defined via `@theme` in `src/app.css`. To change the theme, only modify these values — never hard-code colors in markup.

## Firebase rules

- Firestore security rules must enforce that users can only read/write their own data (`request.auth.uid == userId`).
- Shared access rules must check the `sharedAccess` collection or `shares` subcollection for authorization.
- Always test rules changes with the Firebase emulator before deploying.

## Common commands

```bash
npm run dev                    # Start dev server
npm run build                  # Production build
npm run preview                # Preview production build locally
firebase emulators:start       # Run Firebase emulators (Firestore, Auth)
firebase deploy                # Deploy to Firebase Hosting
```

## Important notes

- Never commit Firebase service account keys or `.env` files containing secrets.
- The app must work offline — Firestore persistence is enabled at startup, and `onSnapshot` listeners handle real-time sync.
- Keep the UI slim and narrow (designed to sit alongside other windows). Avoid wide layouts.
- Minimum time entry duration is 10 seconds — discard anything shorter.
- No SSR — `export const ssr = false` in the root layout. All Firebase interaction is client-side.
- When changes are made, always update SLICKTIMER.md to reflect the changes. The changes to be made include the documented behavior of the app, the design, and the test cases.
