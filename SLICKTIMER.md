
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

- **Route**: `/` — public, accessible with or without authentication.
- **Purpose**: Landing page for slicktimer.com with static information about the app.
- **Layout**: Centered content with `max-w-lg`.
- **Nav bar (logged out)**: Blue nav bar with "Home" tab (active) and "Login" link at the far right.
- **Nav bar (logged in)**: Full Nav component — Home (active), Edit Entries, Edit Tasks, Edit Projects, Run Reports + Open Timer, Logout at far right.
- **"start the clock" link**: In the page body, opens the timer at `/timer` in a slim popup window (`width=300, height=640, resizable=yes`) using `window.open()`. Users can bookmark this link to launch the timer directly.
- **Marketing copy**: Describes SlickTimer as the spiritual successor to SlimTimer, highlighting Project Folders and Offline Mode.
- **Auth-aware**: Imports `getUser()` to detect login state and render the appropriate nav bar.

### Timer screen

- **Route**: `/timer` — requires authentication. Redirects to `/login` if not authenticated.
- **Layout**: Slim, narrow format designed to sit alongside other windows on the user's screen. Ideally launched from the Home page into a slim browser window. When installed as a PWA, this is the primary app window. The screen is split into three vertical zones: (1) the big timer at top, (2) the scrollable task list in the middle, and (3) the Add Task / Add Project forms fixed at the bottom of the viewport.
- **Big timer (daily total)**: The large clock readout at the top shows the **total time logged today** (sum of all completed time entries plus the currently running timer). The timer bar background is green when running, amber when paused (task selected but stopped), and salmon when idle (no active task). In pomodoro mode, the countdown is shown instead of the daily total.
- **Active task name**: The browser window title updates to `[HH:MM:SS] Task Name - SlickTimer` while a timer is running, so the user can see what they're timing at a glance from the taskbar/dock. Resets to `SlickTimer` when stopped.
- **Play/Pause button**: A play/pause icon button sits next to the big timer clock. When the timer is running, clicking it stops the timer. When stopped and there is an active task (one that was previously running this session), clicking it restarts timing that task. Disabled (greyed out) when there is no active task — e.g. on a fresh session before any task has been started, or when the last active task has been completed or archived.
- **Pomodoro toggle**: A hourglass icon button sits next to the big timer. It is grey when pomodoro is off, orange when on. Clicking it toggles pomodoro mode. Only visible when a timer is running.
- **Task list**: Shows all active tasks grouped by project. Tasks within a project can be reordered by dragging. The task list scrolls independently when it overflows. The currently running task row is highlighted with a 50% green tint (`timer-bg-running/50`), matching the green timer bar. The active-but-stopped task (the one that will resume if the play button is pressed) is highlighted with a 50% amber tint (`timer-bg-paused/50`), matching the amber timer bar.
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
  - **Comment carry-over**: When a task is started, the comment from that task's most recent previous time entry today is fetched asynchronously and pre-populated in the comment field (without blocking the timer start). The user can edit or clear it before saving.
- **Starting a timer**: Clicking a task immediately starts the timer — local state updates instantly (optimistic UI) and the Firestore write happens in the background. Only one timer can run at a time.
- **Stopping a timer**: Clicking the currently running task stops its timer instantly (optimistic UI). Clicking a different task stops the current timer and starts a new one, both updating the UI immediately with Firestore writes in the background.
- **Comment carry-over timing**: The carry-over comment is fetched asynchronously after the timer starts, so the timer is never delayed by the Firestore read. The comment field updates once the fetch completes.
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
- **Header row**: Three-section layout — "+ New Entry" link (far left), date with prev/next arrows (center), entry count and daily total (far right).
- **Date navigation**: Previous/next day arrows flank the date label. Defaults to today. The label is locale-aware (respects browser/OS language settings for month/day order). For today, yesterday, and tomorrow it shows a human-friendly label with the short weekday: **"Today · Wed"**, **"Yesterday · Tue"**, **"Tomorrow · Thu"**. All other dates show the full locale-formatted date (e.g. "Wed, Feb 18, 2026" in en-US, or "wo 18 feb 2026" in nl).
- Shows all time entries for the selected day in chronological order (sorted by `startTime`).
- **Entry cards**: Each entry is wrapped in a rounded light-blue box (`bg-entry` / `border-entry`), similar to the original SlimTimer. Compact 3-column layout: left column — time range and duration (top-aligned); middle column — small project color dot + task name (bold) + project name on the same line, tags line below, comment below tags; right column — Edit · Delete buttons. All columns are top-aligned. The tags line always shows — if no tags exist anywhere it shows "No tags"; otherwise shows entry-level tags first, then "From Task: #tag" (if any), then "From Project: #tag" (if any), each section separated by " · ". Duplicates are shown in each section where they appear.
- **Edit**: Each entry has an "Edit" button. Clicking it shows an inline edit form inside the entry card. Editable fields: start time (`input type=time`), end time (`input type=time`), and comment. Duration auto-calculates from start/end. Tags editing will be added later.
- **Delete**: Each entry has a "Delete" button. Clicking it shows an inline "Delete this entry?" confirmation (Yes/No) — no modal. Pressing **Escape** dismisses the confirmation (same as clicking "No").
- **New entry**: A "+ New Entry" link at the far left of the header opens an inline form (with `bg-edit` background). Fields: task (select from active tasks list, showing task name and project), start time, end time, comment. Tags are inherited from the selected task.
- **Seconds handling**: New entries save start time with `:00` seconds and end time with `:59` seconds. When editing, if the user changes the start time, it becomes `:00`; if they change the end time, it becomes `:59`. Unchanged fields preserve their original seconds.
- **Keyboard shortcuts**: **Ctrl+Enter** (Windows/Linux) or **Cmd+Enter** (Mac) saves the currently open Edit or New Entry form. **Escape** cancels the current form or dismisses the delete confirmation.
- **Auto-save on day navigation**: When a form is open and the user clicks the previous/next day arrows, the form is saved first. If validation fails, navigation is blocked and the error is shown.
- **Minimum duration**: When saving an edit or new entry, entries with duration < 10 seconds are rejected.
- **Running entries**: Entries with `endTime: null` are shown with a "(running)" indicator instead of an end time. They are not editable.
- Time entries shorter than 10 seconds are not shown (they are discarded at creation time).

### Edit Tasks screen

- **Route**: `/tasks` — requires authentication.
- **Display**: Tasks listed in a flat list grouped by project (sorted by project order). Each project gets a section header with a color swatch, **bold project name** (slightly larger than task text, not all-caps), and any project-level tags in muted text. Within each project, tasks are sorted by order.
- **Default view**: Shows `active` and `completed` tasks. Archived tasks are hidden unless the "Show archived" toggle (top-right) is on.
- **Task row**: Checkbox (complete toggle), task name, tags, entry stats (count + total duration), and action buttons (Edit · Archive · Delete). Archived tasks show only "Un-archive" and "Delete" actions.
- **Entry stats**: Each task row shows the number of completed time entries and the total tracked time (e.g. "· 3 entries, 2h 15m") computed from the locally loaded `timeEntries` collection.
- **Complete/Uncomplete**: Checkbox toggles between `active` and `completed`. Checking an active task sets `status: completed` with `completedAt`. Unchecking sets `status: active` and clears `completedAt`. If the task is currently running in the timer, an error is shown: "Task is currently running. Stop the timer first."
- **Archive**: Available on any non-archived task (active or completed). For active tasks, it completes the task first (recording `completedAt`) then immediately archives it in a single write. If the task is currently running, shows an error: "Task is currently running. Stop the timer first." Archived tasks are removed from the default view.
- **Un-archive**: Restores a task to `active` and clears `completedAt`.
- **Inline edit form**: Click Edit to replace the row with an edit form. Fields: task name (text), project (select), tags (comma-separated text). Ctrl+Enter saves, Escape cancels.
- **Delete task**: Click Delete to show an inline confirmation showing the count of time entries that will also be deleted. Confirm with "Yes, delete" or dismiss. Uses a Firestore batch write to delete the task and all its time entries atomically.
- **Timer-running guard**: All write operations that check running state query Firestore for a `timeEntries` document with `endTime: null` for that task, since the timer runs in a separate popup window.

### Edit Projects screen

- **Route**: `/projects` — requires authentication.
- **Display**: All projects listed in order. Each row uses a light-blue entry card style (same as Edit Tasks and Edit Entries). Rows show a color swatch, project name, task counts (active / completed / archived), tags, and action buttons (Edit · Complete all · Archive all · Delete).
- **Task counts**: Each project row shows the count of active, completed, and archived tasks. If all are 0, shows "0 tasks". Only non-zero counts are shown when at least one exists (e.g. "2 active 1 archived").
- **Inline edit form**: Click Edit to replace the row with an edit form. Fields: color (`<input type="color">`), name (text), tags (comma-separated text). Ctrl+Enter saves, Escape cancels. Clicking Edit on a different project while one is open auto-saves the current edits (if anything changed) before opening the new form. If nothing changed, no Firestore write is made (no timestamp bump).
- **Complete all tasks**: Click "Complete all" to mark all active tasks in the project as `completed` (with `completedAt`). Shows a confirmation with the task count before executing. If any task is currently running, shows an error and blocks the action. Disabled (but visible) when the project has no active tasks.
- **Archive all tasks**: Click "Archive all" to archive all non-archived (active + completed) tasks in the project. Shows a confirmation stating the count of active and completed tasks that will be archived. If any task is running, shows an error and blocks the action. After archiving, the project disappears from the timer task list without deleting any data. Disabled (but visible) when all tasks are already archived (or the project has no tasks).
- **Delete project**: Click Delete to open a type-to-confirm inline form. Shows the count of tasks and time entries that will be deleted. The Delete button is only enabled when the user has typed the exact project name. Uses a Firestore batch write to delete all time entries, all tasks, and the project document.
- **Timer nav label**: The timer nav shows "Edit Entries" (was "Manage Data") to stay consistent with nav label conventions.

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

| Role             | Color                 | Tailwind token    | Usage                                                     |
| ---------------- | --------------------- | ----------------- | --------------------------------------------------------- |
| Primary          | Soft sky blue         | `primary`         | Top navigation bar, active nav links, section headers     |
| Timer active     | Softened green        | `timer-active`    | Active/running timer indicator, start button              |
| Timer stopped    | Softened red          | `timer-stopped`   | Stopped timer state, stop indicator                       |
| Notification     | Softened orange/amber | `notification`    | Pomodoro alerts, idle notifications, warning states       |
| Background       | White                 | `bg-primary`      | Main content area                                         |
| Background alt   | Very light grey       | `bg-alt`          | Alternating table rows (zebra striping), card backgrounds |
| Text primary     | Near-black            | `text-primary`    | Body text, task names                                     |
| Text secondary   | Medium grey           | `text-secondary`  | Timestamps, metadata, secondary labels                    |
| Border           | Light grey            | `border`          | Input borders, table dividers, section separators         |
| Edit/create area | Soft green tint       | `bg-edit`         | Background for edit modals and create forms               |
| Nav bar          | Light blue            | `nav-bar`         | Navigation bar background (matches original SlimTimer)    |
| Nav text         | White                 | `nav-text`        | Navigation link text color                                |
| Nav hover        | Very light blue       | `nav-hover`       | Navigation link hover background                          |
| Nav active bg    | White                 | `nav-active-bg`   | Currently active navigation tab background                |
| Nav active text  | Medium grey           | `nav-active-text` | Currently active navigation tab text                      |
| Entry background | Light blue            | `bg-entry`        | Time entry card background (matches SlimTimer edit page)  |
| Entry border     | Very light blue       | `border-entry`    | Time entry card border                                    |
| Timer bar stopped bg | Salmon            | `timer-bg-stopped`    | Timer bar background when no task is selected         |
| Timer bar stopped border | Salmon-red    | `timer-border-stopped`| Timer bar border when no task is selected             |
| Timer bar paused bg | Amber              | `timer-bg-paused`     | Timer bar background when task selected but paused    |
| Timer bar paused border | Dark amber     | `timer-border-paused` | Timer bar border when task selected but paused        |
| Timer bar running bg | Green              | `timer-bg-running`    | Timer bar background when timer is actively running   |
| Timer bar running border | Green         | `timer-border-running`| Timer bar border when timer is actively running       |

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
- **Timer bar**: Full-width colored bar at the top of the timer window. Background and border color reflects the current state:
  - **Stopped** (no task selected): salmon background (`#ffcebe` / `timer-bg-stopped`), salmon-red border (`#c56346` / `timer-border-stopped`)
  - **Paused** (task selected but timer not running): amber background (`#fff3bf` / `timer-bg-paused`), amber border (`#c9a227` / `timer-border-paused`)
  - **Running**: green background (`#ccffbf` / `timer-bg-running`), green border (`#55c933` / `timer-border-running`)
- **Timer display**: Large monospace digital clock readout (the most prominent element) inside the timer bar.
- **Task list**: Dense, compact rows. Each row shows task name and a clickable area. Active task is highlighted with `timer-active` background. Minimal padding between rows.
- **Information density**: Extremely high. No whitespace padding beyond what's needed for legibility.

### Form controls

- **Inputs**: Minimal custom styling — consistent thin borders (`border` token), small text (`text-sm`), subtle focus ring. No rounded corners or shadows.
- **Checkboxes**: Lightly styled for cross-browser consistency (Tailwind forms plugin), but kept simple.
- **Buttons**: Flat, minimal buttons with clear text labels. Primary action uses `primary` color. No gradients or 3D effects. Hover state is a slight darkening.
- **Selects/dropdowns**: Styled to match inputs — thin border, small text, no custom arrow unless needed.

### Main site layout

- **Navigation**: Blue navigation bar (`nav-bar` token, `#7EBAFF`) matching the original SlimTimer. Links are white text on blue, with tab-style active state (white background, border on top and sides). Hover state shows light blue background. The nav bar appears on all pages: on the Home page it shows Home/Sign In and Open Timer; on authenticated pages it shows Home/Reports/Entries with Logout and optionally Open Timer (hidden on the timer page itself). The "Open Timer" link opens the timer in a slim popup window.
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
│   │   ├── +page.svelte            # Home page (auth-aware nav)
│   │   ├── +error.svelte           # Error page
│   │   ├── login/
│   │   │   └── +page.svelte        # Login/signup screen
│   │   └── (app)/                  # Route group for authenticated pages
│   │       ├── +layout.svelte      # Auth guard + Nav bar
│   │       ├── timer/
│   │       │   └── +page.svelte    # Timer screen
│   │       ├── entries/
│   │       │   └── +page.svelte    # Edit time entries screen
│   │       ├── tasks/
│   │       │   └── +page.svelte    # Edit Tasks screen
│   │       ├── projects/
│   │       │   └── +page.svelte    # Edit Projects screen
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

**`firebase.json`** — Firestore config + static hosting with SPA rewrite:
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
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

export function useCollection<T = DocumentData>(getPath: () => string | null) {
  let data = $state<T[]>([]);
  let loading = $state(true);

  $effect(() => {
    const path = getPath();
    if (!path) { data = []; loading = false; return; }
    loading = true;
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
  --color-nav-bar: #7EBAFF;
  --color-nav-text: #ffffff;
  --color-nav-hover: #E2F0FF;
  --color-nav-active-bg: #ffffff;
  --color-nav-active-text: #555555;
  --color-bg-entry: #e6f2ff;
  --color-border-entry: #f2f8ff;
}
```

To switch themes, only these values need to change. The markup stays the same.

### Routing and navigation

| Route       | Page         | Auth required | Description                                          |
| ----------- | ------------ | ------------- | ---------------------------------------------------- |
| `/`         | Home         | No            | Public landing page, auth-aware nav                  |
| `/login`    | Login        | No            | Firebase Auth login (email + social providers)       |
| `/timer`    | Timer        | Yes           | Timer sidebar: task list, timer display, daily total |
| `/entries`  | Edit entries | Yes           | Day view of time entries with inline editing         |
| `/tasks`    | Edit Tasks   | Yes           | Inline task editing: name, project, tags, status, delete |
| `/projects` | Edit Projects| Yes           | Inline project editing: name, color, tags, bulk actions, delete |
| `/reports`  | Reports      | Yes           | Pivot table and timesheet with filters               |

Authenticated pages (`/timer`, `/entries`, `/tasks`, `/projects`, `/reports`) live inside a `(app)` route group that shares an auth-guarded layout with the Nav bar. The `(app)` group does not affect URLs.

Navigation is a blue top bar component (`Nav.svelte`) rendered by the `(app)` layout. The Nav links are: Home→`/`, Edit Entries→`/entries`, Edit Tasks→`/tasks`, Edit Projects→`/projects`, Run Reports→`/reports`, with Open Timer and Logout at the far right. The Open Timer button opens `/timer` in a popup window (`width=300, height=640, resizable=yes`). On the timer page, the layout renders a custom nav instead of `Nav.svelte`: **Edit Entries** (opens `/entries` in the main browser window), **Run Reports** (opens `/reports` in the main browser window), and **Logout** at the far right. If the timer was opened via `window.open()`, these links navigate the opener window; otherwise they open a new tab. The Home page (`/`) also renders the Nav component when logged in, or a minimal blue bar with just a Login link when logged out. The root layout (`+layout.svelte`) only imports `app.css` and renders children — no auth logic.

### Key implementation decisions

1. **No SSR** — The app is fully client-side. Firebase Auth and Firestore run in the browser. `adapter-static` produces a static SPA deployed to Firebase Hosting CDN.
2. **No SvelteFire** — Unmaintained and Svelte 5 incompatible. Replaced by ~100 lines of custom rune-based wrappers.
3. **Tailwind v4** — Config-free setup using `@tailwindcss/vite` plugin and `@theme` CSS directives. Design tokens live in `src/app.css`.
4. **Svelte 5 runes throughout** — `$state`, `$derived`, `$effect`, `$props` instead of legacy `$:` and stores. Files using runes at module level use the `.svelte.ts` extension.
5. **PWA via @vite-pwa/sveltekit** — Zero-config Workbox service worker for offline caching and auto-updates.
6. **Client-side only Firebase** — No `firebase-admin` dependency. All Firestore reads/writes happen via the client SDK with security enforced by Firestore rules.
7. **Firestore offline persistence** — `enablePersistence()` is called once at startup. Combined with `onSnapshot` listeners, the app works offline and syncs automatically.
8. **Duration display rounds to nearest minute** — `formatDurationShort()` (used in entry cards, daily totals, task stats, and reports) adds 30 seconds before dividing, so 59 seconds displays as "1m" rather than "0m". The stored `duration` value is unchanged. `formatDuration()` (used in the live timer) remains exact (H:MM:SS).

### Firebase console setup (before coding)

Complete these steps in the [Firebase console](https://console.firebase.google.com) before scaffolding:

1. **Create project** — Click "Add project", name it `slicktimer`, disable Google Analytics (not needed).
2. **Register a Web App** — Project Settings (gear) → "Your apps" → web icon (`</>`). Nickname: `SlickTimer`. Check "Also set up Firebase Hosting". Copy the `firebaseConfig` values into `.env` (see [Key configuration files](#key-configuration-files)).
3. **Enable Authentication** — Go to Authentication → Sign-in method. Enable **Email/Password** and **Google** (set a project support email). Additional providers (GitHub, Microsoft, Apple, etc.) can be added later.
4. **Create Firestore database** — Go to Firestore Database → Create database. Choose a region close to your users (cannot be changed later). Start in **test mode** (proper security rules are written during implementation).
5. **Install Firebase CLI** — Run `npm install -g firebase-tools` and `firebase login`. The `firebase init` command is run after project scaffolding to link the project.

Not needed at this stage: Cloud Functions, Firebase Storage, Realtime Database, manual Firestore collection creation (the app creates collections on first write).

## Manual testing

See [TESTING.md](TESTING.md) for the full manual test plan (T01–T58).
