
# SlickTimer

SlickTimer is a faithful clone of the timer app SlimTimer.com. It aims to be as simple as possible. Fewer features is more.

The demo of the original SlimTimer is here: https://www.youtube.com/watch?v=CeedXS-eZTI

## Table of Contents

- [Features overview](#features-overview)
- [Architecture](#architecture)
- [Features and UI](#features-and-ui)
  - [Authentication](#authentication)
  - [Home page](#home-page)
  - [Timer screen](#timer-screen)
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
  - [Firebase console setup (before coding)](#firebase-console-setup-before-coding)
- [Manual testing](#manual-testing)
  - [Prerequisites](#prerequisites)
  - [Test result format](#test-result-format)
  - [Timer core](#timer-core) (T01–T09)
  - [Pomodoro mode](#pomodoro-mode) (T10–T12)
  - [Comment field](#comment-field) (T13–T16)
  - [Task lifecycle](#task-lifecycle) (T17–T20)
  - [Keyboard shortcuts](#keyboard-shortcuts) (T21–T25)
  - [Duplicate prevention and forms](#duplicate-prevention-and-forms) (T26–T28)
  - [Drag-and-drop reordering](#drag-and-drop-reordering) (T29–T31)
  - [State recovery and browser integration](#state-recovery-and-browser-integration) (T32–T33)
  - [Notifications](#notifications) (T34–T35)
  - [Other](#other) (T36–T40)

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
- After login, users are redirected to `/timer`.

### Home page

- **Route**: `/` — public, no authentication required.
- **Purpose**: Landing page for slicktimer.com with static information about the app.
- **Layout**: Centered content with `max-w-lg`, not using the Nav bar.
- **"Open Timer" button**: Opens the timer app at `/timer` in a slim popup window (`width=300, height=640, resizable=yes`) using `window.open()`. Users can bookmark this link to launch the timer directly.
- **Getting Started section**: Step-by-step instructions explaining how to use SlickTimer (bookmark the timer, click tasks to track time, close the window safely, etc.).
- **Sign In link**: Links to `/login` for users who want to sign in or create an account.
- **No Firebase dependency**: The home page is completely static — no auth state, no Firestore calls.

### Timer screen

- **Route**: `/timer` — requires authentication. Redirects to `/login` if not authenticated.
- **Layout**: Slim, narrow format designed to sit alongside other windows on the user's screen. Ideally launched from the Home page into a slim browser window. When installed as a PWA, this is the primary app window. The screen is split into three vertical zones: (1) the big timer at top, (2) the scrollable task list in the middle, and (3) the Add Task / Add Project forms fixed at the bottom of the viewport.
- **Big timer (daily total)**: The large clock readout at the top shows the **total time logged today** (sum of all completed time entries plus the currently running timer). It is green when a timer is running, grey when idle. In pomodoro mode, it shows the countdown instead.
- **Active task name**: The browser window title updates to `[HH:MM:SS] Task Name - SlickTimer` while a timer is running, so the user can see what they're timing at a glance from the taskbar/dock. Resets to `SlickTimer` when stopped.
- **Play/Pause button**: A play/pause icon button sits next to the big timer clock. When the timer is running, clicking it stops the timer. When stopped and there is an active task (one that was previously running this session), clicking it restarts timing that task. Disabled (greyed out) when there is no active task — e.g. on a fresh session before any task has been started, or when the last active task has been completed or archived.
- **Pomodoro toggle**: A hourglass icon button sits next to the big timer. It is grey when pomodoro is off, orange when on. Clicking it toggles pomodoro mode. Only visible when a timer is running.
- **Task list**: Shows all active tasks grouped by project. Tasks within a project can be reordered by dragging. The task list scrolls independently when it overflows. The currently running task row is highlighted green. The active-but-stopped task (the one that will resume if the play button is pressed) is highlighted with a subtle grey tint so it is visually distinct from other tasks.
- **Per-task duration**: The currently active task row shows the **total duration for that task today** (sum of all completed entries for that task plus the running entry's elapsed time). When the timer is stopped, the duration remains visible on that task row. When a different task is started, only the new task shows its duration — the previous task's inline duration disappears.
- **Duration toggle**: While the timer is running, clicking the duration readout on the running task row toggles between two views: (1) **today's total** for that task (default), and (2) **this entry's elapsed time** (just the current session). The toggle resets to total view when the timer stops or a different task starts.
- **Adding tasks and projects**: The "Add Task" and "Add Project" buttons are fixed at the bottom of the viewport, always visible regardless of scrolling. When creating a task, the user selects a project and optionally adds tags using `#` syntax (e.g., `#billable`). If a task is general-purpose, it should be added to a "General" or "BAU" project.
- **Duplicate prevention**: When adding a project, the name is checked (case-insensitive) against existing projects. When adding a task, the name is checked within the selected project. Duplicates show an inline error message.
- **Form coordination**: Only one form (Add Task or Add Project) can be open at a time. Opening one automatically closes the other, but preserves any text already typed so it isn't lost.
- **Form keyboard shortcuts** (only fire when no input field is focused):
  - **T**: Open Add Task form (input gets focus immediately).
  - **P**: Open Add Project form (input gets focus immediately).
  - **C**: Open Edit Comment field (input gets focus immediately). Only available when a timer is running or a task is active.
  - **Escape**: Close whichever form or field is open.
- **Add Task shortcut**: In the Add Task form, pressing **Ctrl+Enter** (Windows/Linux) or **⌘+Enter** (Mac) saves the task and immediately starts timing it, instead of just saving it.
- **Comment field**: When a timer is running, an "Edit Comment" row appears in the fixed bottom area (alongside Add Task / Add Project). The comment is a single line of free text associated with the current time entry.
  - Pressing Enter saves the comment to Firestore and closes the field.
  - Pressing Escape closes the field without saving.
  - When the timer is stopped, the comment field becomes read-only and shows the saved comment, until a new task is started (at which point it resets).
  - **Comment carry-over**: When a task is started, the comment from that task's most recent previous time entry today is pre-populated in the comment field. The user can edit or clear it before saving.
- **Starting a timer**: Clicking a task immediately starts a timer and creates a new time entry. Only one timer can run at a time.
- **Stopping a timer**: Clicking the currently running task stops its timer. Clicking a different task stops the current timer and starts a new one for the clicked task.
- **Minimum duration**: If a time entry's duration is less than 10 seconds when stopped, it is discarded and not saved.
- **Pomodoro mode**: The user can toggle the running timer to pomodoro mode via the hourglass icon button (25-minute countdown). When the countdown reaches zero, a browser notification alerts the user, but the timer continues running until manually stopped. The timer displays overtime as `+H:MM:SS` after the target is exceeded.
- **Idle notification**: If no timer is running for 15 minutes, a browser notification prompts the user to start timing. Notification permission is requested as soon as the user is authenticated (on first page load after login), so it is available for both idle and pomodoro alerts.
- **Sharing**: Tasks and projects can be shared with other SlickTimer users:
  - **Co-workers** (via `@username` or `@email`): Can log their own time entries against shared tasks.
  - **Reporters**: Can view reports on shared tasks/projects but cannot log time.
  - Shared users must have their own SlickTimer account.

### Task management

- Every task belongs to exactly one project.
- Tasks have three states: **active**, **completed**, **archived**.
  - **Active**: Visible on the main screen, can be timed.
  - **Completed**: Still visible in the main task list with strikethrough styling. Always shows its total today-duration to the right. Cannot be timed — the task name is not clickable. Unchecking the checkbox reactivates it. An archive button appears next to completed tasks to immediately archive them.
  - **Archived**: Removed from the main screen entirely.
- **Completing a task**: Each task row has a checkbox. Checking it stops the timer if the task is currently running, then sets the task to `completed` and records `completedAt`. Unchecking it sets it back to `active` and clears `completedAt`.
- **Auto-archive**: Completed tasks are hidden from the main screen if `completedAt` is before today (client-side filter — no background job or Cloud Functions needed). Completed tasks remain visible for the rest of the day they were completed, then disappear the next morning.
- **Manual archive**: A task can be immediately archived by clicking an archive button that appears on completed task rows.
- **Drag to reorder**: Tasks within a project can be reordered by dragging. Tasks cannot be dragged into a different project. Projects themselves can also be reordered by dragging the project header — the entire project block (header + tasks) moves together. Reorder changes persist immediately to Firestore on drop. Pressing **Escape** during a drag cancels the reorder. Implemented using `svelte-dnd-action`.
- Tasks can be deleted. Deleting a task also deletes its time entries (with a confirmation prompt).

### Tags

- Tags are managed per project (each project has its own tag pool).
- Tags can be applied to both tasks and time entries.
- Time entries inherit the tags of their parent task by default. Users can add or remove tags on individual time entries.
- Tags are created inline using `#` syntax (e.g., typing `#billable` creates the tag if it doesn't exist).
- Tags are simple strings, no hierarchy or nesting.

### Edit Time Entries screen

- **Route**: `/entries` — requires authentication.
- **Date picker**: Header row with previous/next day arrows and the current date displayed as a readable string (e.g. "Mon, Feb 16, 2026"). Defaults to today.
- Shows all time entries for the selected day in chronological order (sorted by `startTime`).
- Each time entry displays: start time, end time, duration, task name, project name, tags (as `#tag`), and comment.
- **Zebra striping**: Alternating row backgrounds (`bg-primary` / `bg-alt`) for readability.
- **Edit**: Each entry has an "Edit" button. Clicking it shows an inline edit form (with `bg-edit` background). Editable fields: start time (`input type=time`), end time (`input type=time`), and comment. Duration auto-calculates from start/end. Tags editing will be added later.
- **Delete**: Each entry has a "Del" button. Clicking it shows an inline "Delete this entry?" confirmation (Yes/No) — no modal.
- **New entry**: A "+ New Entry" button at the top opens an inline form (with `bg-edit` background). Fields: task (select from active tasks list, showing task name and project), start time, end time, comment. Tags are inherited from the selected task.
- **Minimum duration**: When saving an edit or new entry, entries with duration < 10 seconds are rejected.
- **Daily total**: Footer row showing the sum of all completed entry durations for the day.
- **Running entries**: Entries with `endTime: null` are shown with a "(running)" indicator instead of an end time. They are not editable.
- Time entries shorter than 10 seconds are not shown (they are discarded at creation time).

### Reporting screen

- **Route**: `/reports` — requires authentication.
- **Report type toggle**: Button group to switch between Pivot Table (default) and Timesheet views.
- **Report types**:
  - **Pivot table** (default): User configures what appears on rows and columns via two dropdown selects. Options for rows/columns include: project, task, and date. Cell values show total hours in `H:MM` format. Includes row totals, column totals, and grand total. Zebra-striped rows.
  - **Timesheet**: A chronological table of time entries showing time range, task, project, and duration. Tags and comments are shown in a sub-row below entries that have them. Includes a total at the bottom. Zebra-striped rows.
- **Time frame presets**: Today, This Week, Last Week, This Month, Last Month — displayed as a button group. Custom date range shows two date inputs.
- **Filters**: Project and tag dropdown selects. Default to "All". Filtering is client-side on loaded data.
- **Data loading**: Queries `timeEntries` where `date >= startDate && date <= endDate`. Re-queries when date range changes. Tasks and projects are loaded via `useCollection` for name lookups.
- **Shared data**: Reporters with access to shared tasks/projects can see individual time entries from all users who logged time against those tasks.
- **Export**: CSV export button generates a CSV file client-side (using Blob URL) and triggers a browser download. Includes columns: Date, Task, Project, Start, End, Duration, Tags, Comment.

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

- **Width**: Full width of the browser window — no fixed or maximum width. Designed to be dragged to a narrow width (~200–300px) by the user and floated alongside other windows.
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
│   │   ├── +layout.svelte          # Root layout (imports app.css only, no auth)
│   │   ├── +layout.ts              # Disables SSR (export const ssr = false)
│   │   ├── +page.svelte            # Public Home page (no auth required)
│   │   ├── +error.svelte           # Error page
│   │   ├── login/
│   │   │   └── +page.svelte        # Login/signup screen
│   │   └── (app)/                  # Route group for authenticated pages
│   │       ├── +layout.svelte      # Auth guard + Nav bar
│   │       ├── timer/
│   │       │   └── +page.svelte    # Timer screen
│   │       ├── entries/
│   │       │   └── +page.svelte    # Edit time entries screen
│   │       └── reports/
│   │           └── +page.svelte    # Reporting screen
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
        start_url: '/timer',
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

| Route      | Page         | Auth required | Description                                            |
| ---------- | ------------ | ------------- | ------------------------------------------------------ |
| `/`        | Home         | No            | Public landing page with "Open Timer" link             |
| `/login`   | Login        | No            | Firebase Auth login (email + social providers)         |
| `/timer`   | Timer        | Yes           | Timer sidebar: task list, timer display, daily total   |
| `/entries` | Edit entries | Yes           | Day view of time entries with inline editing           |
| `/reports` | Reports      | Yes           | Pivot table and timesheet with filters                 |

Authenticated pages (`/timer`, `/entries`, `/reports`) live inside a `(app)` route group that shares an auth-guarded layout with the Nav bar. The `(app)` group does not affect URLs.

Navigation is a minimal top bar component (`Nav.svelte`) rendered by the `(app)` layout. It's implemented as a swappable layout component — changing the navigation style (e.g. to sidebar or tabbed) only requires swapping this component, not rewriting routes or pages. The root layout (`+layout.svelte`) only imports `app.css` and renders children — no auth logic.

### Key implementation decisions

1. **No SSR** — The app is fully client-side. Firebase Auth and Firestore run in the browser. `adapter-static` produces a static SPA deployed to Firebase Hosting CDN.
2. **No SvelteFire** — Unmaintained and Svelte 5 incompatible. Replaced by ~100 lines of custom rune-based wrappers.
3. **Tailwind v4** — Config-free setup using `@tailwindcss/vite` plugin and `@theme` CSS directives. Design tokens live in `src/app.css`.
4. **Svelte 5 runes throughout** — `$state`, `$derived`, `$effect`, `$props` instead of legacy `$:` and stores. Files using runes at module level use the `.svelte.ts` extension.
5. **PWA via @vite-pwa/sveltekit** — Zero-config Workbox service worker for offline caching and auto-updates.
6. **Client-side only Firebase** — No `firebase-admin` dependency. All Firestore reads/writes happen via the client SDK with security enforced by Firestore rules.
7. **Firestore offline persistence** — `enablePersistence()` is called once at startup. Combined with `onSnapshot` listeners, the app works offline and syncs automatically.

### Firebase console setup (before coding)

Complete these steps in the [Firebase console](https://console.firebase.google.com) before scaffolding:

1. **Create project** — Click "Add project", name it `slicktimer`, disable Google Analytics (not needed).
2. **Register a Web App** — Project Settings (gear) → "Your apps" → web icon (`</>`). Nickname: `SlickTimer`. Check "Also set up Firebase Hosting". Copy the `firebaseConfig` values into `.env` (see [Key configuration files](#key-configuration-files)).
3. **Enable Authentication** — Go to Authentication → Sign-in method. Enable **Email/Password** and **Google** (set a project support email). Additional providers (GitHub, Microsoft, Apple, etc.) can be added later.
4. **Create Firestore database** — Go to Firestore Database → Create database. Choose a region close to your users (cannot be changed later). Start in **test mode** (proper security rules are written during implementation).
5. **Install Firebase CLI** — Run `npm install -g firebase-tools` and `firebase login`. The `firebase init` command is run after project scaffolding to link the project.

Not needed at this stage: Cloud Functions, Firebase Storage, Realtime Database, manual Firestore collection creation (the app creates collections on first write).

## Manual testing

### Prerequisites

Before running manual tests:
1. Start the dev server with `npm run dev`.
2. Ensure Firebase emulators are running (`firebase emulators:start`) or that the app is connected to a live Firebase project.
3. Log in with a test account (email/password or Google).
4. Create at least two projects (e.g. "Project A", "Project B") and two tasks per project if they don't already exist.

### Test result format

For each test, record the **Actual outcome** after executing the steps. Leave it blank before testing.

### Timer core

#### T01 — Start a timer by clicking a task

|                      |                                                                                                                                                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Clicking an active task starts a timer and creates a time entry in Firestore.                                                                                                                                                                              |
| **Preconditions**    | No timer is running. At least one active task exists.                                                                                                                                                                                                      |
| **Steps**            | 1. Click the name of an active task in the task list.                                                                                                                                                                                                      |
| **Expected outcome** | The timer starts. The big timer clock turns green and begins counting up. The clicked task row is highlighted green. A time entry document is created in Firestore with `endTime: null`. The browser title updates to `[HH:MM:SS] Task Name - SlickTimer`. |
| **Actual outcome**   |                                                                                                                                                                                                                                                            |

#### T02 — Stop a timer by clicking the running task

|                      |                                                                                                                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | Clicking the currently running task stops the timer.                                                                                                                                                                                                                     |
| **Preconditions**    | A timer is running on a task.                                                                                                                                                                                                                                            |
| **Steps**            | 1. Click the name of the currently running (green-highlighted) task.                                                                                                                                                                                                     |
| **Expected outcome** | The timer stops. The big timer clock turns grey and freezes. The task row loses its green highlight but retains a subtle grey tint (active-but-stopped). The time entry in Firestore is updated with `endTime` and `duration`. The browser title resets to `SlickTimer`. |
| **Actual outcome**   |                                                                                                                                                                                                                                                                          |

#### T03 — Switch timer to a different task

|                      |                                                                                                                                                                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Clicking a different task stops the current timer and starts a new one.                                                                                                                                                                                                             |
| **Preconditions**    | A timer is running on Task A. Task B exists in the task list.                                                                                                                                                                                                                       |
| **Steps**            | 1. While Task A is timing, click Task B.                                                                                                                                                                                                                                            |
| **Expected outcome** | Task A's timer stops (its time entry gets `endTime` and `duration` in Firestore). A new time entry is created for Task B. The green highlight moves from Task A to Task B. The big timer resets and starts counting from 0:00:00 for Task B. The browser title shows Task B's name. |
| **Actual outcome**   |                                                                                                                                                                                                                                                                                     |

#### T04 — Play/Pause button resumes the last active task

|                      |                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The play button resumes timing the most recently active task.                                                                                                          |
| **Preconditions**    | A timer was running and was stopped (the task row shows a subtle grey tint).                                                                                           |
| **Steps**            | 1. Stop a running timer by clicking the running task. 2. Click the play button next to the big timer.                                                                  |
| **Expected outcome** | A new time entry is created for the previously active task. The timer starts again. The big timer turns green and counts from 0:00:00. The task row turns green again. |
| **Actual outcome**   |                                                                                                                                                                        |

#### T05 — Play button is disabled when no active task

|                      |                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------- |
| **Scenario**         | The play button is disabled on a fresh session with no previously active task.            |
| **Preconditions**    | Fresh page load (or after clearing session state). No task has been started this session. |
| **Steps**            | 1. Load the main page. 2. Observe the play button next to the big timer.                  |
| **Expected outcome** | The play button appears greyed out / disabled. Clicking it does nothing.                  |
| **Actual outcome**   |                                                                                           |

#### T06 — Minimum duration enforcement (< 10 seconds)

|                      |                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Time entries shorter than 10 seconds are discarded.                                                                                                  |
| **Preconditions**    | No timer is running.                                                                                                                                 |
| **Steps**            | 1. Click a task to start timing. 2. Immediately (within a few seconds) click the same task to stop, or click a different task.                       |
| **Expected outcome** | The time entry is deleted from Firestore because its duration is less than 10 seconds. No short entry appears in the daily summary or task duration. |
| **Actual outcome**   |                                                                                                                                                      |

#### T07 — Daily total in the big timer

|                      |                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The big timer shows the sum of all today's completed entries plus the running entry.                                                                 |
| **Preconditions**    | At least one completed time entry exists for today.                                                                                                  |
| **Steps**            | 1. Note the big timer value when idle (should show today's total so far). 2. Start a new timer. 3. Observe the big timer counting up from the total. |
| **Expected outcome** | The big timer shows the cumulative total for today (all completed entries + running elapsed), not just the current entry's elapsed time.             |
| **Actual outcome**   |                                                                                                                                                      |

#### T08 — Per-task duration display (today's total)

|                      |                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The running task row shows its total duration for today.                                                         |
| **Preconditions**    | A task has at least one completed time entry today.                                                              |
| **Steps**            | 1. Start timing a task that already has entries today. 2. Observe the duration shown on the task row.            |
| **Expected outcome** | The task row shows the sum of all completed entries for that task today plus the currently running elapsed time. |
| **Actual outcome**   |                                                                                                                  |

#### T09 — Duration toggle (daily total vs. current entry)

|                      |                                                                                                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Clicking the duration on a running task toggles between daily total and current entry elapsed.                                                                                                                    |
| **Preconditions**    | A task is running and has at least one prior completed entry today (so the two values differ).                                                                                                                    |
| **Steps**            | 1. While a task is running, click the duration readout on its task row. 2. Click it again.                                                                                                                        |
| **Expected outcome** | First click: switches from daily total to current entry elapsed (a smaller number). Second click: switches back to daily total. The toggle resets to daily total when the timer stops or a different task starts. |
| **Actual outcome**   |                                                                                                                                                                                                                   |

### Pomodoro mode

#### T10 — Pomodoro mode toggle

|                      |                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Toggling pomodoro mode changes the timer display to a countdown.                                                                                                 |
| **Preconditions**    | A timer is running.                                                                                                                                              |
| **Steps**            | 1. While a timer is running, click the hourglass icon button next to the big timer. 2. Observe the timer display.                                                |
| **Expected outcome** | The hourglass icon turns orange. The big timer switches to a countdown from 25:00. The timer counts down while the underlying time entry continues accumulating. |
| **Actual outcome**   |                                                                                                                                                                  |

#### T11 — Pomodoro countdown reaches zero

|                      |                                                                                                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | When the pomodoro countdown reaches zero, a notification fires and overtime is shown.                                                                                                                                       |
| **Preconditions**    | Pomodoro mode is active and near zero (or wait for full 25 minutes).                                                                                                                                                        |
| **Steps**            | 1. Start a timer and enable pomodoro mode. 2. Wait until the countdown reaches 0:00.                                                                                                                                        |
| **Expected outcome** | A browser notification appears: "SlickTimer - Pomodoro complete!". The timer continues running and displays overtime as `+H:MM:SS`. The timer color changes to the notification/orange color. The timer does not auto-stop. |
| **Actual outcome**   |                                                                                                                                                                                                                             |

#### T12 — Pomodoro button visibility

|                      |                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | The pomodoro hourglass button is only visible when a timer is running.                                                         |
| **Preconditions**    | None.                                                                                                                          |
| **Steps**            | 1. With no timer running, observe the area next to the big timer. 2. Start a timer. 3. Observe the area again.                 |
| **Expected outcome** | When idle, the hourglass button is not visible. When the timer is running, the hourglass button appears next to the big timer. |
| **Actual outcome**   |                                                                                                                                |

### Comment field

#### T13 — Comment field while timer is running

|                      |                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The comment field is editable while a timer is running.                                                                                        |
| **Preconditions**    | A timer is running.                                                                                                                            |
| **Steps**            | 1. While a timer is running, click the "Add comment" row at the bottom of the screen (or press **C**). 2. Type a comment. 3. Press **Enter**.  |
| **Expected outcome** | The comment input appears and gets focus. After pressing Enter, the comment is saved to the current time entry in Firestore. The input closes. |
| **Actual outcome**   |                                                                                                                                                |

#### T14 — Comment field: Escape cancels without saving

|                      |                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Pressing Escape in the comment field closes it without saving changes.                                                |
| **Preconditions**    | A timer is running. The comment field is open.                                                                        |
| **Steps**            | 1. Open the comment field. 2. Type some text. 3. Press **Escape**.                                                    |
| **Expected outcome** | The comment field closes. The typed text is not saved to Firestore. The previous comment value (if any) is preserved. |
| **Actual outcome**   |                                                                                                                       |

#### T15 — Comment carry-over from previous entry

|                      |                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | When starting a task, the comment from its most recent entry today is pre-populated.                                                                      |
| **Preconditions**    | A task has a previous time entry today with a saved comment.                                                                                              |
| **Steps**            | 1. Start a task that has a prior time entry with a comment today. 2. Open the comment field.                                                              |
| **Expected outcome** | The comment field is pre-populated with the comment from the task's most recent time entry today. The text is selected so the user can easily replace it. |
| **Actual outcome**   |                                                                                                                                                           |

#### T16 — Comment field becomes read-only when timer stops

|                      |                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | When the timer stops, the comment field becomes read-only.                                                                           |
| **Preconditions**    | A timer is running with a saved comment.                                                                                             |
| **Steps**            | 1. While a timer is running, save a comment. 2. Stop the timer. 3. Observe the comment field area.                                   |
| **Expected outcome** | The comment field shows the saved comment as read-only text (not an editable input). It remains visible until a new task is started. |
| **Actual outcome**   |                                                                                                                                      |

### Task lifecycle

#### T17 — Complete a task (checkbox)

|                      |                                                                                                                                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Checking the checkbox on a task completes it and stops the timer if running.                                                                                                                                                                                                      |
| **Preconditions**    | A task is active. Optionally, it is currently being timed.                                                                                                                                                                                                                        |
| **Steps**            | 1. Check the checkbox on an active task (that is currently running).                                                                                                                                                                                                              |
| **Expected outcome** | The timer stops (if it was running on this task). The task row shows strikethrough text. The task name is no longer clickable. The task's total today-duration is shown. An archive button appears. The task status in Firestore is `"completed"` with a `completedAt` timestamp. |
| **Actual outcome**   |                                                                                                                                                                                                                                                                                   |

#### T18 — Uncomplete a task (uncheck checkbox)

|                      |                                                                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Unchecking a completed task reactivates it.                                                                                                                                      |
| **Preconditions**    | A completed task exists in the task list.                                                                                                                                        |
| **Steps**            | 1. Uncheck the checkbox on a completed task.                                                                                                                                     |
| **Expected outcome** | The task returns to active state. The strikethrough is removed. The task name becomes clickable again. In Firestore, `status` is set to `"active"` and `completedAt` is cleared. |
| **Actual outcome**   |                                                                                                                                                                                  |

#### T19 — Archive a completed task

|                      |                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Clicking the archive button removes a completed task from the main screen.                                                            |
| **Preconditions**    | A completed task is visible in the task list (with archive button shown).                                                             |
| **Steps**            | 1. Click the archive (trash) button on a completed task.                                                                              |
| **Expected outcome** | The task disappears from the task list. In Firestore, `status` is set to `"archived"`. The task no longer appears on the main screen. |
| **Actual outcome**   |                                                                                                                                       |

#### T20 — Auto-archive of completed tasks (next day)

|                      |                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Completed tasks from previous days are automatically hidden.                                                                          |
| **Preconditions**    | A task was completed yesterday (or earlier).                                                                                          |
| **Steps**            | 1. Complete a task. 2. Reload the app the next day (or simulate by changing the date filter logic).                                   |
| **Expected outcome** | Completed tasks whose `completedAt` is before today are not shown in the main task list. They still exist in Firestore (not deleted). |
| **Actual outcome**   |                                                                                                                                       |

### Keyboard shortcuts

#### T21 — Keyboard shortcut: T opens Add Task form

|                      |                                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Pressing T (with no input focused) opens the Add Task form.                                                                                                               |
| **Preconditions**    | No input, select, or textarea element is focused.                                                                                                                         |
| **Steps**            | 1. Ensure no form field is focused. 2. Press the **T** key.                                                                                                               |
| **Expected outcome** | The Add Task form opens at the bottom of the screen. The task name input gets focus immediately. If the Add Project form was open, it closes (preserving any typed text). |
| **Actual outcome**   |                                                                                                                                                                           |

#### T22 — Keyboard shortcut: P opens Add Project form

|                      |                                                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Pressing P (with no input focused) opens the Add Project form.                                                                                                               |
| **Preconditions**    | No input, select, or textarea element is focused.                                                                                                                            |
| **Steps**            | 1. Ensure no form field is focused. 2. Press the **P** key.                                                                                                                  |
| **Expected outcome** | The Add Project form opens at the bottom of the screen. The project name input gets focus immediately. If the Add Task form was open, it closes (preserving any typed text). |
| **Actual outcome**   |                                                                                                                                                                              |

#### T23 — Keyboard shortcut: C opens Comment field

|                      |                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------- |
| **Scenario**         | Pressing C (with no input focused) opens the comment field.                             |
| **Preconditions**    | A timer is running or a task is active (stopped but resumable). No input is focused.    |
| **Steps**            | 1. Start a timer. 2. Click outside any input to remove focus. 3. Press the **C** key.   |
| **Expected outcome** | The comment field opens and gets focus. The existing comment text (if any) is selected. |
| **Actual outcome**   |                                                                                         |

#### T24 — Keyboard shortcut: Escape closes open form

|                      |                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Pressing Escape closes whichever form or field is open.                                                  |
| **Preconditions**    | A form (Add Task, Add Project, or Comment) is open.                                                      |
| **Steps**            | 1. Open any form using its keyboard shortcut. 2. Press **Escape**.                                       |
| **Expected outcome** | The open form closes. No data is saved or lost (typed text is preserved for Add Task/Add Project forms). |
| **Actual outcome**   |                                                                                                          |

#### T25 — Add Task with Ctrl+Enter starts timer immediately

|                      |                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | Pressing Ctrl+Enter (or Cmd+Enter on Mac) in the Add Task form saves and starts timing.                                                                      |
| **Preconditions**    | The Add Task form is open. A project is selected.                                                                                                            |
| **Steps**            | 1. Open the Add Task form. 2. Select a project. 3. Type a task name. 4. Press **Ctrl+Enter** (or **Cmd+Enter** on Mac).                                      |
| **Expected outcome** | The task is created in Firestore. A timer immediately starts for the new task. The task row appears in the list highlighted green. The Add Task form closes. |
| **Actual outcome**   |                                                                                                                                                              |

### Duplicate prevention and forms

#### T26 — Duplicate project name prevention

|                      |                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Creating a project with a name that already exists (case-insensitive) shows an error.                   |
| **Preconditions**    | A project named "Project A" exists.                                                                     |
| **Steps**            | 1. Open the Add Project form. 2. Type "project a" (lowercase). 3. Submit.                               |
| **Expected outcome** | An inline error message appears indicating the project name already exists. The project is not created. |
| **Actual outcome**   |                                                                                                         |

#### T27 — Duplicate task name prevention (within project)

|                      |                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Creating a task with a name that already exists within the same project shows an error.                           |
| **Preconditions**    | "Project A" has a task named "Design work".                                                                       |
| **Steps**            | 1. Open the Add Task form. 2. Select "Project A". 3. Type "design work" (lowercase). 4. Submit.                   |
| **Expected outcome** | An inline error message appears indicating the task name already exists in this project. The task is not created. |
| **Actual outcome**   |                                                                                                                   |

#### T28 — Form coordination (only one form open at a time)

|                      |                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Opening one form closes the other, preserving typed text.                                                                                                     |
| **Preconditions**    | None.                                                                                                                                                         |
| **Steps**            | 1. Open Add Task form and type "my new task". 2. Open Add Project form (press **P** or click button). 3. Re-open Add Task form (press **T** or click button). |
| **Expected outcome** | When Add Project opens, Add Task closes. When Add Task re-opens, the previously typed text "my new task" is still there.                                      |
| **Actual outcome**   |                                                                                                                                                               |

### Drag-and-drop reordering

#### T29 — Drag to reorder tasks within a project

|                      |                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Tasks can be reordered by dragging within their project group.                                                                |
| **Preconditions**    | A project has at least two tasks.                                                                                             |
| **Steps**            | 1. Drag the second task above the first task within the same project. 2. Release.                                             |
| **Expected outcome** | The tasks swap positions. The new order persists after page reload. The `order` field in Firestore is updated for both tasks. |
| **Actual outcome**   |                                                                                                                               |

#### T30 — Drag to reorder projects

|                      |                                                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Projects (with all their tasks) can be reordered by dragging the project header.                                                                                            |
| **Preconditions**    | At least two projects exist with tasks.                                                                                                                                     |
| **Steps**            | 1. Drag the second project header above the first project. 2. Release.                                                                                                      |
| **Expected outcome** | The entire project block (header + tasks) moves to the new position. The new order persists after page reload. The `order` field in Firestore is updated for both projects. |
| **Actual outcome**   |                                                                                                                                                                             |

#### T31 — Escape cancels drag reorder

|                      |                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------- |
| **Scenario**         | Pressing Escape during a drag cancels the reorder.                                          |
| **Preconditions**    | A drag operation is in progress.                                                            |
| **Steps**            | 1. Begin dragging a task or project. 2. While still dragging, press **Escape**.             |
| **Expected outcome** | The drag is cancelled. Items return to their original positions. No Firestore writes occur. |
| **Actual outcome**   |                                                                                             |

### State recovery and browser integration

#### T32 — Timer recovery on page reload

|                      |                                                                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | Reloading the page while a timer is running recovers the timer state.                                                                                                                                                                                  |
| **Preconditions**    | A timer is currently running.                                                                                                                                                                                                                          |
| **Steps**            | 1. Start timing a task. 2. Wait at least 15 seconds. 3. Reload the page (F5 or Ctrl+R).                                                                                                                                                                |
| **Expected outcome** | After reload, the timer is still running for the same task. The elapsed time is calculated from the original `startTime` in Firestore (not reset to zero). The big timer shows the correct cumulative elapsed time. The task row is highlighted green. |
| **Actual outcome**   |                                                                                                                                                                                                                                                        |

#### T33 — Browser title updates while timing

|                      |                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The browser tab title shows the running timer and task name.                                                                                      |
| **Preconditions**    | None.                                                                                                                                             |
| **Steps**            | 1. Start timing a task named "Design work". 2. Observe the browser tab title. 3. Stop the timer. 4. Observe the title again.                      |
| **Expected outcome** | While running: the tab title shows `[H:MM:SS] Design work - SlickTimer` and updates every second. When stopped: the title resets to `SlickTimer`. |
| **Actual outcome**   |                                                                                                                                                   |

### Notifications

#### T34 — Idle notification after 15 minutes

|                      |                                                                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | If no timer runs for 15 minutes, a browser notification prompts the user.                                                                                      |
| **Preconditions**    | Browser notification permission is granted. No timer is running.                                                                                               |
| **Steps**            | 1. Stop any running timer. 2. Wait 15 minutes without starting a new timer.                                                                                    |
| **Expected outcome** | A browser notification appears: "SlickTimer - You haven't been timing for 15 minutes." The notification fires once until a timer is started and stopped again. |
| **Actual outcome**   |                                                                                                                                                                |

#### T35 — Notification permission request on first load

|                      |                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The app requests notification permission when the user first authenticates.                                                                                             |
| **Preconditions**    | Browser notification permission is in "default" state (not yet granted or denied).                                                                                      |
| **Steps**            | 1. Clear notification permissions for the app's origin. 2. Log in.                                                                                                      |
| **Expected outcome** | The browser prompts for notification permission. If granted, idle and pomodoro notifications will work. If denied, the app continues to function without notifications. |
| **Actual outcome**   |                                                                                                                                                                         |

### Other

#### T36 — Inline tag parsing with # syntax

|                      |                                                                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Tags can be added to tasks using `#tag` syntax in the task name input.                                                                                                              |
| **Preconditions**    | The Add Task form is open with a project selected.                                                                                                                                  |
| **Steps**            | 1. In the task name field, type "Design homepage #billable #frontend". 2. Submit the form.                                                                                          |
| **Expected outcome** | A task named "Design homepage" is created with tags `["billable", "frontend"]`. The `#billable` and `#frontend` portions are parsed out of the name and stored in the `tags` array. |
| **Actual outcome**   |                                                                                                                                                                                     |

#### T37 — Completed task shows duration but is not clickable

|                      |                                                                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Completed tasks display their today-duration but cannot be timed.                                                                                                                      |
| **Preconditions**    | A completed task exists with time entries from today.                                                                                                                                  |
| **Steps**            | 1. Complete a task that has entries today. 2. Observe the task row. 3. Try to click the task name.                                                                                     |
| **Expected outcome** | The task row shows the total duration for today. The task name has strikethrough styling. Clicking the name does not start a timer (the name is not clickable / has no click handler). |
| **Actual outcome**   |                                                                                                                                                                                        |

#### T38 — Previous task duration disappears when switching tasks

|                      |                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | When a different task is started, the previous task's inline duration disappears.                                      |
| **Preconditions**    | Task A has been running and accumulating duration. Task B exists.                                                      |
| **Steps**            | 1. Start timing Task A. Let it run for 15+ seconds. 2. Click Task B to switch. 3. Observe Task A's row.                |
| **Expected outcome** | Task A's inline duration display disappears (it is no longer the active task). Only Task B shows its running duration. |
| **Actual outcome**   |                                                                                                                        |

#### T39 — Big timer color: green when running, grey when idle

|                      |                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The big timer clock changes color based on state.                                                                                                           |
| **Preconditions**    | None.                                                                                                                                                       |
| **Steps**            | 1. Observe the big timer when no timer is running. 2. Start a timer. 3. Observe the color. 4. Stop the timer.                                               |
| **Expected outcome** | Idle: the timer text is grey. Running: the timer text turns green (`timer-active` color). Pomodoro overtime: the timer turns orange (`notification` color). |
| **Actual outcome**   |                                                                                                                                                             |

#### T40 — Login and logout flow

|                      |                                                                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Users can log in, see their data, and the app redirects unauthenticated users.                                                                                                                                             |
| **Preconditions**    | A test account exists (email/password or Google).                                                                                                                                                                          |
| **Steps**            | 1. Navigate to `/timer` while logged out. 2. Verify redirect to login page. 3. Log in with credentials. 4. Verify redirect to `/timer` with user's projects/tasks. 5. Log out (if logout UI exists) or clear auth state. |
| **Expected outcome** | Unauthenticated users navigating to `/timer` are redirected to `/login`. After login, the user is redirected to `/timer` and sees their own projects and tasks. The Home page at `/` is accessible without authentication. Each user's data is isolated.                                                                                   |
| **Actual outcome**   |                                                                                                                                                                                                                            |
