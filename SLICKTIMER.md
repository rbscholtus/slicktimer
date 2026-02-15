
# SlickTimer

SlickTimer is a faithful clone of the timer app SlimTimer.com. It aims to be as simple as possible. Fewer features is more.

The demo of the original SlimTimer is here: https://www.youtube.com/watch?v=CeedXS-eZTI

## Table of Contents

- [Features overview](#features-overview)
- [Architecture](#architecture)
- [Features and UI](#features-and-ui)
  - [Authentication](#authentication)
  - [Main screen](#main-screen)
  - [Task management](#task-management)
  - [Tags](#tags)
  - [Edit Time Entries screen](#edit-time-entries-screen)
  - [Reporting screen](#reporting-screen)
- [Visual design and styling](#visual-design-and-styling)
  - [Design philosophy](#design-philosophy)
  - [Theming and switchability](#theming-and-switchability)
  - [Color palette (default theme: "Softened Functional")](#color-palette-default-theme-softened-functional)
  - [Typography](#typography)
  - [Timer popup/sidebar](#timer-popupsidebar)
  - [Form controls](#form-controls)
  - [Main site layout](#main-site-layout)
  - [Iconography](#iconography)
  - [Spacing and density](#spacing-and-density)
- [Data model](#data-model)
  - [`users` collection](#users-collection)
  - [`users/{uid}/projects` subcollection](#usersuidprojects-subcollection)
  - [`users/{uid}/projects/{projectId}/shares` subcollection](#usersuidprojectsprojectidshares-subcollection)
  - [`users/{uid}/tasks` subcollection](#usersuidtasks-subcollection)
  - [`users/{uid}/tasks/{taskId}/shares` subcollection](#usersuidtaskstaskidshares-subcollection)
  - [`users/{uid}/timeEntries` subcollection](#usersuidtimeentries-subcollection)
  - [`sharedAccess` top-level collection (for querying incoming shares)](#sharedaccess-top-level-collection-for-querying-incoming-shares)
  - [Data model notes](#data-model-notes)
- [Implementation overview](#implementation-overview)
  - [Project scaffolding](#project-scaffolding)
  - [Project structure](#project-structure)
  - [Key configuration files](#key-configuration-files)
  - [Firebase wrappers (replacing SvelteFire)](#firebase-wrappers-replacing-sveltefire)
  - [Tailwind v4 theming](#tailwind-v4-theming)
  - [Routing and navigation](#routing-and-navigation)
  - [Key implementation decisions](#key-implementation-decisions)

## Features overview

- Login with email or social login. Each login has its own data.
- Manage tasks per project. Tasks can be tagged.
- Time tasks using time entries. Time entries can be tagged, and there can be a 1-liner comment for each time entry.
- Edit time entries.
- Report time as pivot table or timesheet.

## Architecture

- Firebase app: Firestore for data storage, Firebase Auth for authentication, Firebase Hosting for static deployment (no Cloud Functions needed).
- SvelteKit 2 + Svelte 5 (with runes) for the UI framework. Custom Firebase wrappers using Svelte 5 runes (`$state`, `$effect`) instead of SvelteFire (which is unmaintained and incompatible with Svelte 5).
- Tailwind CSS v4 for styling — utility-first approach with design tokens defined via `@theme` in CSS. No `tailwind.config.js` (v4 uses CSS-based configuration).
- `@sveltejs/adapter-static` in SPA mode — the app is fully client-side (all Firebase interaction happens in the browser).
- `@vite-pwa/sveltekit` for PWA/offline support with Workbox. Firestore's built-in offline persistence handles data sync automatically when connectivity returns.

## Features and UI

### Authentication

- Firebase Auth supports login with email/password, as well as social logins: Google, Microsoft, LinkedIn, X/Twitter, GitHub, Apple.
- New users simply log in, and an account is automatically created for them (Firebase Auth handles this).
- Each authenticated user gets their own isolated data space (user document in Firestore).

### Main screen

- **Layout**: Slim, narrow format designed to sit alongside other windows on the user's screen.
- **Daily summary**: At the top of the screen, the total time logged for the current day is displayed prominently.
- **Task list**: Shows all active tasks grouped by project. Tasks within a project can be reordered by dragging.
- **Adding tasks**: Users add tasks via an "Add Task" button or keyboard shortcut. When creating a task, the user selects a project and optionally adds tags using `#` syntax (e.g., `#billable`). If a task is general-purpose, it should be added to a "General" or "BAU" project.
- **Starting a timer**: Clicking a task immediately starts a timer and creates a new time entry. Only one timer can run at a time.
- **Stopping a timer**: Clicking the currently running task stops its timer. Clicking a different task stops the current timer and starts a new one for the clicked task.
- **Minimum duration**: If a time entry's duration is less than 10 seconds when stopped, it is discarded and not saved.
- **Pomodoro mode**: The user can toggle the running timer to pomodoro mode (25-minute countdown). When the countdown reaches zero, a notification/sound alerts the user, but the timer continues running until manually stopped.
- **Idle notification**: If no timer is running for 15 minutes, a browser notification prompts the user to start timing.
- **Sharing**: Tasks and projects can be shared with other SlickTimer users:
  - **Co-workers** (via `@username` or `@email`): Can log their own time entries against shared tasks.
  - **Reporters**: Can view reports on shared tasks/projects but cannot log time.
  - Shared users must have their own SlickTimer account.

### Task management

- Every task belongs to exactly one project.
- Tasks have three states: **active**, **completed**, **archived**.
  - **Active**: Visible on the main screen, can be timed.
  - **Completed**: Marked as done, hidden from the main task list but visible in a "completed" filter. Can be reactivated.
  - **Archived**: Fully hidden from the main screen. Can be unarchived if needed.
- Tasks within a project can be reordered by dragging.
- Tasks can be deleted. Deleting a task also deletes its time entries (with a confirmation prompt).

### Tags

- Tags are managed per project (each project has its own tag pool).
- Tags can be applied to both tasks and time entries.
- Time entries inherit the tags of their parent task by default. Users can add or remove tags on individual time entries.
- Tags are created inline using `#` syntax (e.g., typing `#billable` creates the tag if it doesn't exist).
- Tags are simple strings, no hierarchy or nesting.

### Edit Time Entries screen

- Shows all time entries for the selected day in chronological order.
- Each time entry displays: task name, project, start time, end time, duration, tags, and comment.
- Users can edit all fields of a time entry: start time, end time, tags, and comment.
- Users can manually create new time entries for past work (selecting task, start/end time, tags, comment).
- Users can delete time entries.
- Time entries shorter than 10 seconds are not shown (they are discarded at creation time).

### Reporting screen

- **Report types**:
  - **Pivot table**: User configures what appears on rows and columns. Options for rows/columns include: project, task, tag, and date. Cell values show total hours.
  - **Timesheet**: A chronological list of time entries showing task, project, start, end, duration, tags, and comment.
- **Time frame presets**: Today, This Week, Last Week, This Month, Last Month. Custom date range is also supported.
- **Filters**: By project, by tag, by task. Multiple filters can be combined.
- **Shared data**: Reporters with access to shared tasks/projects can see individual time entries from all users who logged time against those tasks.
- **Export**: Reports can be exported to CSV.

## Visual design and styling

### Design philosophy

**Utilitarian Minimalist.** SlickTimer is a professional tool, not a consumer app. It avoids generous spacing, rounded corners, heavy shadows, and hero images in favor of a fast-loading, text-heavy, information-dense interface. Every pixel serves a purpose.

### Theming and switchability

All visual design decisions are encoded as Tailwind v4 design tokens via `@theme` in `src/app.css`. This means:
- Colors, spacing, border radii, and font sizes are defined once as CSS theme tokens.
- Switching the entire look-and-feel (e.g. from "softened functional" to "bold/vibrant" or "modern muted") requires only changing the theme values — no markup changes.
- Navigation style (top bar vs sidebar vs tabbed) should be implemented as a swappable layout component, so the structure can be changed without rewriting page content.

### Color palette (default theme: "Softened Functional")

The default palette uses the same hue families as the original SlimTimer but with slightly reduced saturation for a cleaner, modern feel.

| Role             | Color                 | Tailwind token   | Usage                                                     |
| ---------------- | --------------------- | ---------------- | --------------------------------------------------------- |
| Primary          | Soft sky blue         | `primary`        | Top navigation bar, active nav links, section headers     |
| Timer active     | Softened green        | `timer-active`   | Active/running timer indicator, start button              |
| Timer stopped    | Softened red          | `timer-stopped`  | Stopped timer state, stop indicator                       |
| Notification     | Softened orange/amber | `notification`   | Pomodoro alerts, idle notifications, warning states       |
| Background       | White                 | `bg-primary`     | Main content area                                         |
| Background alt   | Very light grey       | `bg-alt`         | Alternating table rows (zebra striping), card backgrounds |
| Text primary     | Near-black            | `text-primary`   | Body text, task names                                     |
| Text secondary   | Medium grey           | `text-secondary` | Timestamps, metadata, secondary labels                    |
| Border           | Light grey            | `border`         | Input borders, table dividers, section separators         |
| Edit/create area | Soft green tint       | `bg-edit`        | Background for edit modals and create forms               |

**Alternate themes** (future, config-only switches):
- **Bold/Vibrant**: Original SlimTimer colors — saturated orange, bright red, lime green.
- **Modern Muted**: Amber instead of orange, rose instead of red, emerald instead of lime.

### Typography

- **Font**: System font stack (`system-ui, -apple-system, sans-serif`). No web font loading — instant rendering, native feel.
- **Size**: Small and dense. Body text at `text-sm` (14px). Timer clock readout is the largest element on screen.
- **Weight**: Regular for body, semibold for headings and active states. No light/thin weights.
- **Line height**: Tight (`leading-tight` or `leading-snug`) to maximize information density.

### Timer popup/sidebar

- **Width**: Narrow, fixed width (~280–320px). Designed to float alongside other windows.
- **Header**: Colored bar using the `notification` token (softened orange/amber). Shows the current timer state.
- **Timer display**: Large monospace digital clock readout (the most prominent element).
- **Task list**: Dense, compact rows. Each row shows task name and a clickable area. Active task is highlighted with `timer-active` background. Minimal padding between rows.
- **Information density**: Extremely high. No whitespace padding beyond what's needed for legibility.

### Form controls

- **Inputs**: Minimal custom styling — consistent thin borders (`border` token), small text (`text-sm`), subtle focus ring. No rounded corners or shadows.
- **Checkboxes**: Lightly styled for cross-browser consistency (Tailwind forms plugin), but kept simple.
- **Buttons**: Flat, minimal buttons with clear text labels. Primary action uses `primary` color. No gradients or 3D effects. Hover state is a slight darkening.
- **Selects/dropdowns**: Styled to match inputs — thin border, small text, no custom arrow unless needed.

### Main site layout

- **Navigation**: Clean minimal top bar with simple text links. Active page indicated by underline or color change using `primary` token. No colored header band — just a thin bottom border separating nav from content.
- **Content area**: White background, full width within the narrow layout. Sections separated by subtle horizontal rules or spacing.
- **Tables**: Zebra-striped rows (alternating `bg-primary` and `bg-alt`) for task lists, time entries, and reports. Compact row height. No heavy borders between cells — rely on background alternation for row distinction.
- **Modals/edit areas**: Differentiated with `bg-edit` (soft green tint) background. Inline or overlay, kept simple.

### Iconography

- Minimal. Only use icons for: print, CSV export, add/plus, delete/trash, play/stop, and navigation.
- Use a lightweight icon set (e.g. Heroicons outline) — no filled/heavy icons.
- Icons are secondary to text labels. Never icon-only buttons without a tooltip.

### Spacing and density

- Tight spacing throughout. Prefer `p-1`/`p-2` over `p-4`/`p-6`.
- No large gaps, hero sections, or decorative whitespace.
- Tables and lists should feel "packed" but still scannable.
- The goal is: maximum information visible without scrolling.

## Data model

Firestore collections and document structure:

### `users` collection

Each document ID = Firebase Auth UID.

| Field                       | Type      | Description                                             |
| --------------------------- | --------- | ------------------------------------------------------- |
| `email`                     | string    | User's email address                                    |
| `displayName`               | string    | Display name                                            |
| `photoURL`                  | string    | Profile photo URL (from social login)                   |
| `createdAt`                 | timestamp | Account creation date                                   |
| `updatedAt`                 | timestamp | Last profile update                                     |
| `settings`                  | map       | User preferences                                        |
| `settings.pomodoroEnabled`  | boolean   | Whether pomodoro mode is active                         |
| `settings.pomodoroDuration` | number    | Pomodoro duration in minutes (default: 25)              |
| `settings.idleNotification` | boolean   | Whether idle notifications are enabled (default: true)  |
| `settings.idleThreshold`    | number    | Minutes of inactivity before notification (default: 15) |

### `users/{uid}/projects` subcollection

Each document ID = auto-generated.

| Field       | Type            | Description               |
| ----------- | --------------- | ------------------------- |
| `name`      | string          | Project name              |
| `color`     | string          | Display color (hex)       |
| `tags`      | array\<string\> | Tag pool for this project |
| `order`     | number          | Sort order in the UI      |
| `createdAt` | timestamp       | Creation date             |
| `updatedAt` | timestamp       | Last update               |

### `users/{uid}/projects/{projectId}/shares` subcollection

Each document ID = shared user's UID.

| Field      | Type      | Description                  |
| ---------- | --------- | ---------------------------- |
| `role`     | string    | `"coworker"` or `"reporter"` |
| `sharedBy` | string    | UID of the user who shared   |
| `sharedAt` | timestamp | When the share was created   |

### `users/{uid}/tasks` subcollection

Each document ID = auto-generated.

| Field         | Type              | Description                                |
| ------------- | ----------------- | ------------------------------------------ |
| `name`        | string            | Task name                                  |
| `projectId`   | string            | Reference to parent project                |
| `tags`        | array\<string\>   | Tags applied to this task                  |
| `status`      | string            | `"active"`, `"completed"`, or `"archived"` |
| `order`       | number            | Sort order within the project              |
| `createdAt`   | timestamp         | Creation date                              |
| `updatedAt`   | timestamp         | Last update                                |
| `completedAt` | timestamp \| null | When the task was completed                |

### `users/{uid}/tasks/{taskId}/shares` subcollection

Each document ID = shared user's UID.

| Field      | Type      | Description                  |
| ---------- | --------- | ---------------------------- |
| `role`     | string    | `"coworker"` or `"reporter"` |
| `sharedBy` | string    | UID of the user who shared   |
| `sharedAt` | timestamp | When the share was created   |

### `users/{uid}/timeEntries` subcollection

Each document ID = auto-generated.

| Field       | Type              | Description                                                            |
| ----------- | ----------------- | ---------------------------------------------------------------------- |
| `taskId`    | string            | Reference to the task                                                  |
| `projectId` | string            | Reference to the project (denormalized for query efficiency)           |
| `startTime` | timestamp         | When the timer started                                                 |
| `endTime`   | timestamp \| null | When the timer stopped (null while running)                            |
| `duration`  | number            | Duration in seconds (computed on stop, updated on edit)                |
| `tags`      | array\<string\>   | Tags (initialized from task tags, editable)                            |
| `comment`   | string            | Optional one-line comment                                              |
| `date`      | string            | Date in `YYYY-MM-DD` format (denormalized for date-range queries)      |
| `createdAt` | timestamp         | Creation date                                                          |
| `updatedAt` | timestamp         | Last update                                                            |
| `userId`    | string            | UID of the user who created the entry (needed for shared task queries) |

### `sharedAccess` top-level collection (for querying incoming shares)

Each document ID = auto-generated.

| Field           | Type      | Description                                  |
| --------------- | --------- | -------------------------------------------- |
| `ownerUid`      | string    | UID of the data owner                        |
| `sharedWithUid` | string    | UID of the user receiving access             |
| `type`          | string    | `"project"` or `"task"`                      |
| `refPath`       | string    | Firestore path to the shared project or task |
| `role`          | string    | `"coworker"` or `"reporter"`                 |
| `createdAt`     | timestamp | When the share was created                   |

### Data model notes

- **Denormalization**: `projectId` and `date` are stored on time entries to enable efficient Firestore queries (Firestore does not support joins).
- **Shared access**: The `sharedAccess` collection exists so users can query "what has been shared with me?" without scanning all other users' data. When a share is created/removed, both the subcollection share doc and the `sharedAccess` doc are written/deleted in a batch.
- **Co-worker time entries**: When a co-worker logs time against a shared task, the time entry is stored under the co-worker's own `timeEntries` subcollection, with `taskId` and `projectId` pointing to the owner's task/project. Reports on shared items query across relevant users' time entries.
- **Offline support**: Firestore's `enablePersistence()` handles offline reads/writes. The app uses Firestore's real-time listeners (`onSnapshot`) so the UI updates automatically when data syncs.

## Implementation overview

### Project scaffolding

The project is created with:
```bash
npx sv create slicktimer --template minimal --types ts --add tailwindcss,eslint,prettier --install npm
```

This generates a SvelteKit 2 + Svelte 5 + Tailwind v4 project with TypeScript, ESLint, and Prettier pre-configured.

Additional dependencies to install:
```bash
npm install firebase                          # Firebase client SDK (v12+)
npm install -D @sveltejs/adapter-static       # Static/SPA adapter
npm install -D @vite-pwa/sveltekit            # PWA support
npm install -D @tailwindcss/forms             # Tailwind forms plugin
```

### Project structure

```
slicktimer/
├── src/
│   ├── app.html                    # HTML shell template
│   ├── app.css                     # Tailwind entry + @theme tokens
│   ├── routes/
│   │   ├── +layout.svelte          # Root layout (imports app.css, auth guard)
│   │   ├── +layout.ts              # Disables SSR (export const ssr = false)
│   │   ├── +page.svelte            # Main timer screen (home)
│   │   ├── +error.svelte           # Error page
│   │   ├── login/
│   │   │   └── +page.svelte        # Login/signup screen
│   │   ├── entries/
│   │   │   └── +page.svelte        # Edit time entries screen
│   │   └── reports/
│   │       └── +page.svelte        # Reporting screen
│   └── lib/
│       ├── firebase/
│       │   ├── config.ts           # Firebase app initialization
│       │   ├── auth.svelte.ts      # Auth state wrapper (runes)
│       │   ├── firestore.svelte.ts # Reactive doc/collection wrappers (runes)
│       │   └── types.ts            # TypeScript interfaces matching data model
│       ├── components/
│       │   ├── Nav.svelte          # Top navigation bar (swappable layout)
│       │   ├── Timer.svelte        # Timer display + controls
│       │   ├── TaskList.svelte     # Task list grouped by project
│       │   ├── TaskRow.svelte      # Single task row (click to start timer)
│       │   ├── TimeEntryRow.svelte # Single time entry (editable)
│       │   ├── TagInput.svelte     # Inline tag editor with # syntax
│       │   ├── PivotTable.svelte   # Configurable pivot table report
│       │   └── Timesheet.svelte    # Chronological time entry list report
│       ├── stores/
│       │   └── timer.svelte.ts     # Active timer state (runes)
│       └── utils/
│           ├── format.ts           # Duration/time formatting helpers
│           └── dates.ts            # Date range helpers (week, month, etc.)
├── static/
│   ├── favicon.png
│   ├── icon-192.png                # PWA icon
│   └── icon-512.png                # PWA icon
├── svelte.config.js                # SvelteKit config (adapter-static, SPA mode)
├── vite.config.ts                  # Vite config (Tailwind plugin, PWA plugin)
├── tsconfig.json
├── package.json
├── firebase.json                   # Firebase Hosting config
├── firestore.rules                 # Firestore security rules
├── .firebaserc                     # Firebase project reference
├── .env                            # Firebase config vars (PUBLIC_ prefix)
├── CLAUDE.md
└── SLICKTIMER.md
```

### Key configuration files

**`svelte.config.js`** — SPA mode, no SSR:
```javascript
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ fallback: '200.html' }),
    serviceWorker: { register: false },  // @vite-pwa handles this
  },
};
```

**`vite.config.ts`** — Tailwind v4 + PWA:
```typescript
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SlickTimer',
        short_name: 'SlickTimer',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4a90d9',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
```

**`src/routes/+layout.ts`** — disable SSR:
```typescript
export const ssr = false;
export const prerender = false;
```

**`firebase.json`** — static hosting with SPA rewrite:
```json
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/200.html" }]
  }
}
```

**`.env`** — Firebase config (all `PUBLIC_` for client-side access):
```
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=...
PUBLIC_FIREBASE_PROJECT_ID=...
PUBLIC_FIREBASE_STORAGE_BUCKET=...
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
PUBLIC_FIREBASE_APP_ID=...
```

### Firebase wrappers (replacing SvelteFire)

Since SvelteFire is unmaintained and incompatible with Svelte 5, the app uses custom wrappers built with Svelte 5 runes. These are thin — roughly 100 lines total.

**`src/lib/firebase/config.ts`** — Firebase initialization:
```typescript
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enablePersistence } from 'firebase/firestore';
import { PUBLIC_FIREBASE_API_KEY, /* ... */ } from '$env/static/public';

const config = { apiKey: PUBLIC_FIREBASE_API_KEY, /* ... */ };
const app = getApps().length ? getApp() : initializeApp(config);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence (call once)
enablePersistence(db).catch(() => {});
```

**`src/lib/firebase/auth.svelte.ts`** — reactive auth state:
```typescript
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './config';

let user = $state<User | null>(null);
let loading = $state(true);

onAuthStateChanged(auth, (u) => {
  user = u;
  loading = false;
});

export function getUser() {
  return {
    get current() { return user; },
    get loading() { return loading; },
  };
}
```

**`src/lib/firebase/firestore.svelte.ts`** — reactive Firestore bindings:
```typescript
import { onSnapshot, doc, collection, type DocumentData } from 'firebase/firestore';
import { db } from './config';

export function useDoc<T = DocumentData>(path: string) {
  let data = $state<T | null>(null);
  let loading = $state(true);

  $effect(() => {
    const unsub = onSnapshot(doc(db, path), (snap) => {
      data = snap.exists() ? (snap.data() as T) : null;
      loading = false;
    });
    return unsub;
  });

  return { get data() { return data; }, get loading() { return loading; } };
}

export function useCollection<T = DocumentData>(path: string) {
  let data = $state<T[]>([]);
  let loading = $state(true);

  $effect(() => {
    const unsub = onSnapshot(collection(db, path), (snap) => {
      data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
      loading = false;
    });
    return unsub;
  });

  return { get data() { return data; }, get loading() { return loading; } };
}
```

### Tailwind v4 theming

Design tokens are defined in `src/app.css` using `@theme` (Tailwind v4 syntax — no `tailwind.config.js`):

```css
@import 'tailwindcss';

@theme {
  --color-primary: #4a90d9;
  --color-timer-active: #5cb85c;
  --color-timer-stopped: #d9534f;
  --color-notification: #e8943a;
  --color-bg-primary: #ffffff;
  --color-bg-alt: #f7f8fa;
  --color-bg-edit: #eef7ee;
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #6b7280;
  --color-border: #d1d5db;
}
```

To switch themes, only these values need to change. The markup stays the same.

### Routing and navigation

| Route      | Page         | Description                                          |
| ---------- | ------------ | ---------------------------------------------------- |
| `/`        | Main screen  | Timer sidebar: task list, timer display, daily total |
| `/login`   | Login        | Firebase Auth login (email + social providers)       |
| `/entries` | Edit entries | Day view of time entries with inline editing         |
| `/reports` | Reports      | Pivot table and timesheet with filters               |

Navigation is a minimal top bar component (`Nav.svelte`). It's implemented as a swappable layout component — changing the navigation style (e.g. to sidebar or tabbed) only requires swapping this component, not rewriting routes or pages.

### Key implementation decisions

1. **No SSR** — The app is fully client-side. Firebase Auth and Firestore run in the browser. `adapter-static` produces a static SPA deployed to Firebase Hosting CDN.
2. **No SvelteFire** — Unmaintained and Svelte 5 incompatible. Replaced by ~100 lines of custom rune-based wrappers.
3. **Tailwind v4** — Config-free setup using `@tailwindcss/vite` plugin and `@theme` CSS directives. Design tokens live in `src/app.css`.
4. **Svelte 5 runes throughout** — `$state`, `$derived`, `$effect`, `$props` instead of legacy `$:` and stores. Files using runes at module level use the `.svelte.ts` extension.
5. **PWA via @vite-pwa/sveltekit** — Zero-config Workbox service worker for offline caching and auto-updates.
6. **Client-side only Firebase** — No `firebase-admin` dependency. All Firestore reads/writes happen via the client SDK with security enforced by Firestore rules.
7. **Firestore offline persistence** — `enablePersistence()` is called once at startup. Combined with `onSnapshot` listeners, the app works offline and syncs automatically.
