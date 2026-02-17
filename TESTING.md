
# SlickTimer — Manual Testing

See [SLICKTIMER.md](SLICKTIMER.md) for the full requirements, data model, and implementation overview.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Test result format](#test-result-format)
- [Timer core](#timer-core)
  - [T01 — Start a timer by clicking a task](#t01--start-a-timer-by-clicking-a-task)
  - [T02 — Stop a timer by clicking the running task](#t02--stop-a-timer-by-clicking-the-running-task)
  - [T03 — Switch timer to a different task](#t03--switch-timer-to-a-different-task)
  - [T04 — Play/Pause button resumes the last active task](#t04--playpause-button-resumes-the-last-active-task)
  - [T05 — Play button is disabled when no active task](#t05--play-button-is-disabled-when-no-active-task)
  - [T06 — Minimum duration enforcement (\< 10 seconds)](#t06--minimum-duration-enforcement--10-seconds)
  - [T07 — Daily total in the big timer](#t07--daily-total-in-the-big-timer)
  - [T08 — Per-task duration display (today's total)](#t08--per-task-duration-display-todays-total)
  - [T09 — Duration toggle (daily total vs. current entry)](#t09--duration-toggle-daily-total-vs-current-entry)
- [Pomodoro mode](#pomodoro-mode)
  - [T10 — Pomodoro mode toggle](#t10--pomodoro-mode-toggle)
  - [T11 — Pomodoro countdown reaches zero](#t11--pomodoro-countdown-reaches-zero)
  - [T12 — Pomodoro button visibility](#t12--pomodoro-button-visibility)
- [Comment field](#comment-field)
  - [T13 — Comment field while timer is running](#t13--comment-field-while-timer-is-running)
  - [T14 — Comment field: Escape cancels without saving](#t14--comment-field-escape-cancels-without-saving)
  - [T15 — Comment carry-over from previous entry](#t15--comment-carry-over-from-previous-entry)
  - [T16 — Comment field becomes read-only when timer stops](#t16--comment-field-becomes-read-only-when-timer-stops)
- [Task lifecycle](#task-lifecycle)
  - [T17 — Complete a task (checkbox)](#t17--complete-a-task-checkbox)
  - [T18 — Uncomplete a task (uncheck checkbox)](#t18--uncomplete-a-task-uncheck-checkbox)
  - [T19 — Archive a completed task](#t19--archive-a-completed-task)
  - [T20 — Auto-archive of completed tasks (next day)](#t20--auto-archive-of-completed-tasks-next-day)
- [Keyboard shortcuts](#keyboard-shortcuts)
  - [T21 — Keyboard shortcut: T opens Add Task form](#t21--keyboard-shortcut-t-opens-add-task-form)
  - [T22 — Keyboard shortcut: P opens Add Project form](#t22--keyboard-shortcut-p-opens-add-project-form)
  - [T23 — Keyboard shortcut: C opens Comment field](#t23--keyboard-shortcut-c-opens-comment-field)
  - [T24 — Keyboard shortcut: Escape closes open form](#t24--keyboard-shortcut-escape-closes-open-form)
  - [T25 — Add Task with Ctrl+Enter starts timer immediately](#t25--add-task-with-ctrlenter-starts-timer-immediately)
- [Duplicate prevention and forms](#duplicate-prevention-and-forms)
  - [T26 — Duplicate project name prevention](#t26--duplicate-project-name-prevention)
  - [T27 — Duplicate task name prevention (within project)](#t27--duplicate-task-name-prevention-within-project)
  - [T28 — Form coordination (only one form open at a time)](#t28--form-coordination-only-one-form-open-at-a-time)
- [Drag-and-drop reordering](#drag-and-drop-reordering)
  - [T29 — Drag to reorder tasks within a project](#t29--drag-to-reorder-tasks-within-a-project)
  - [T30 — Drag to reorder projects](#t30--drag-to-reorder-projects)
  - [T31 — Escape cancels drag reorder](#t31--escape-cancels-drag-reorder)
- [State recovery and browser integration](#state-recovery-and-browser-integration)
  - [T32 — Timer recovery on page reload](#t32--timer-recovery-on-page-reload)
  - [T33 — Browser title updates while timing](#t33--browser-title-updates-while-timing)
- [Notifications](#notifications)
  - [T34 — Idle notification after 15 minutes](#t34--idle-notification-after-15-minutes)
  - [T35 — Notification permission request on first load](#t35--notification-permission-request-on-first-load)
- [Other](#other)
  - [T36 — Inline tag parsing with # syntax](#t36--inline-tag-parsing-with--syntax)
  - [T37 — Completed task shows duration but is not clickable](#t37--completed-task-shows-duration-but-is-not-clickable)
  - [T38 — Previous task duration disappears when switching tasks](#t38--previous-task-duration-disappears-when-switching-tasks)
  - [T39 — Big timer color: green when running, grey when idle](#t39--big-timer-color-green-when-running-grey-when-idle)
  - [T40 — Login and logout flow](#t40--login-and-logout-flow)
- [Edit time entries](#edit-time-entries)
  - [T41 — Navigate to entries page and see today's entries](#t41--navigate-to-entries-page-and-see-todays-entries)
  - [T42 — Navigate between days](#t42--navigate-between-days)
  - [T43 — Create a new manual time entry](#t43--create-a-new-manual-time-entry)
  - [T44 — New entry form validation](#t44--new-entry-form-validation)
  - [T45 — Cancel new entry form](#t45--cancel-new-entry-form)
  - [T46 — Edit an existing time entry](#t46--edit-an-existing-time-entry)
  - [T47 — Edit entry validation](#t47--edit-entry-validation)
  - [T48 — Cancel edit entry](#t48--cancel-edit-entry)
  - [T49 — Delete a time entry](#t49--delete-a-time-entry)
  - [T50 — Cancel delete entry](#t50--cancel-delete-entry)
  - [T51 — Running entry shown with "(running)" indicator](#t51--running-entry-shown-with-running-indicator)
  - [T52 — Daily total accuracy](#t52--daily-total-accuracy)
- [Navigation](#navigation)
  - [T53 — Home page nav when logged out](#t53--home-page-nav-when-logged-out)
  - [T54 — Home page nav when logged in](#t54--home-page-nav-when-logged-in)
  - [T55 — Timer page nav (Manage Data / Run Reports)](#t55--timer-page-nav-manage-data--run-reports)
  - [T56 — Nav links navigate correctly](#t56--nav-links-navigate-correctly)
  - [T57 — Tasks and Projects stub pages](#t57--tasks-and-projects-stub-pages)
  - [T58 — Unauthenticated access to protected pages](#t58--unauthenticated-access-to-protected-pages)

## Prerequisites

Before running manual tests:
1. Start the dev server with `npm run dev`.
2. Ensure Firebase emulators are running (`firebase emulators:start`) or that the app is connected to a live Firebase project.
3. Log in with a test account (email/password or Google).
4. Create at least two projects (e.g. "Project A", "Project B") and two tasks per project if they don't already exist.

## Test result format

For each test, record the **Actual outcome** after executing the steps. Leave it blank before testing.

## Timer core

### T01 — Start a timer by clicking a task

|                      |                                                                                                                                                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Clicking an active task starts a timer and creates a time entry in Firestore.                                                                                                                                                                              |
| **Preconditions**    | No timer is running. At least one active task exists.                                                                                                                                                                                                      |
| **Steps**            | 1. Click the name of an active task in the task list.                                                                                                                                                                                                      |
| **Expected outcome** | The timer starts. The big timer clock turns green and begins counting up. The clicked task row is highlighted green. A time entry document is created in Firestore with `endTime: null`. The browser title updates to `[HH:MM:SS] Task Name - SlickTimer`. |
| **Actual outcome**   |                                                                                                                                                                                                                                                            |

### T02 — Stop a timer by clicking the running task

|                      |                                                                                                                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | Clicking the currently running task stops the timer.                                                                                                                                                                                                                     |
| **Preconditions**    | A timer is running on a task.                                                                                                                                                                                                                                            |
| **Steps**            | 1. Click the name of the currently running (green-highlighted) task.                                                                                                                                                                                                     |
| **Expected outcome** | The timer stops. The big timer clock turns grey and freezes. The task row loses its green highlight but retains a subtle grey tint (active-but-stopped). The time entry in Firestore is updated with `endTime` and `duration`. The browser title resets to `SlickTimer`. |
| **Actual outcome**   |                                                                                                                                                                                                                                                                          |

### T03 — Switch timer to a different task

|                      |                                                                                                                                                                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Clicking a different task stops the current timer and starts a new one.                                                                                                                                                                                                             |
| **Preconditions**    | A timer is running on Task A. Task B exists in the task list.                                                                                                                                                                                                                       |
| **Steps**            | 1. While Task A is timing, click Task B.                                                                                                                                                                                                                                            |
| **Expected outcome** | Task A's timer stops (its time entry gets `endTime` and `duration` in Firestore). A new time entry is created for Task B. The green highlight moves from Task A to Task B. The big timer resets and starts counting from 0:00:00 for Task B. The browser title shows Task B's name. |
| **Actual outcome**   |                                                                                                                                                                                                                                                                                     |

### T04 — Play/Pause button resumes the last active task

|                      |                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The play button resumes timing the most recently active task.                                                                                                          |
| **Preconditions**    | A timer was running and was stopped (the task row shows a subtle grey tint).                                                                                           |
| **Steps**            | 1. Stop a running timer by clicking the running task. 2. Click the play button next to the big timer.                                                                  |
| **Expected outcome** | A new time entry is created for the previously active task. The timer starts again. The big timer turns green and counts from 0:00:00. The task row turns green again. |
| **Actual outcome**   |                                                                                                                                                                        |

### T05 — Play button is disabled when no active task

|                      |                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------- |
| **Scenario**         | The play button is disabled on a fresh session with no previously active task.            |
| **Preconditions**    | Fresh page load (or after clearing session state). No task has been started this session. |
| **Steps**            | 1. Load the main page. 2. Observe the play button next to the big timer.                  |
| **Expected outcome** | The play button appears greyed out / disabled. Clicking it does nothing.                  |
| **Actual outcome**   |                                                                                           |

### T06 — Minimum duration enforcement (< 10 seconds)

|                      |                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Time entries shorter than 10 seconds are discarded.                                                                                                  |
| **Preconditions**    | No timer is running.                                                                                                                                 |
| **Steps**            | 1. Click a task to start timing. 2. Immediately (within a few seconds) click the same task to stop, or click a different task.                       |
| **Expected outcome** | The time entry is deleted from Firestore because its duration is less than 10 seconds. No short entry appears in the daily summary or task duration. |
| **Actual outcome**   |                                                                                                                                                      |

### T07 — Daily total in the big timer

|                      |                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The big timer shows the sum of all today's completed entries plus the running entry.                                                                 |
| **Preconditions**    | At least one completed time entry exists for today.                                                                                                  |
| **Steps**            | 1. Note the big timer value when idle (should show today's total so far). 2. Start a new timer. 3. Observe the big timer counting up from the total. |
| **Expected outcome** | The big timer shows the cumulative total for today (all completed entries + running elapsed), not just the current entry's elapsed time.             |
| **Actual outcome**   |                                                                                                                                                      |

### T08 — Per-task duration display (today's total)

|                      |                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The running task row shows its total duration for today.                                                         |
| **Preconditions**    | A task has at least one completed time entry today.                                                              |
| **Steps**            | 1. Start timing a task that already has entries today. 2. Observe the duration shown on the task row.            |
| **Expected outcome** | The task row shows the sum of all completed entries for that task today plus the currently running elapsed time. |
| **Actual outcome**   |                                                                                                                  |

### T09 — Duration toggle (daily total vs. current entry)

|                      |                                                                                                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Clicking the duration on a running task toggles between daily total and current entry elapsed.                                                                                                                    |
| **Preconditions**    | A task is running and has at least one prior completed entry today (so the two values differ).                                                                                                                    |
| **Steps**            | 1. While a task is running, click the duration readout on its task row. 2. Click it again.                                                                                                                        |
| **Expected outcome** | First click: switches from daily total to current entry elapsed (a smaller number). Second click: switches back to daily total. The toggle resets to daily total when the timer stops or a different task starts. |
| **Actual outcome**   |                                                                                                                                                                                                                   |

## Pomodoro mode

### T10 — Pomodoro mode toggle

|                      |                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Toggling pomodoro mode changes the timer display to a countdown.                                                                                                 |
| **Preconditions**    | A timer is running.                                                                                                                                              |
| **Steps**            | 1. While a timer is running, click the hourglass icon button next to the big timer. 2. Observe the timer display.                                                |
| **Expected outcome** | The hourglass icon turns orange. The big timer switches to a countdown from 25:00. The timer counts down while the underlying time entry continues accumulating. |
| **Actual outcome**   |                                                                                                                                                                  |

### T11 — Pomodoro countdown reaches zero

|                      |                                                                                                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | When the pomodoro countdown reaches zero, a notification fires and overtime is shown.                                                                                                                                       |
| **Preconditions**    | Pomodoro mode is active and near zero (or wait for full 25 minutes).                                                                                                                                                        |
| **Steps**            | 1. Start a timer and enable pomodoro mode. 2. Wait until the countdown reaches 0:00.                                                                                                                                        |
| **Expected outcome** | A browser notification appears: "SlickTimer - Pomodoro complete!". The timer continues running and displays overtime as `+H:MM:SS`. The timer color changes to the notification/orange color. The timer does not auto-stop. |
| **Actual outcome**   |                                                                                                                                                                                                                             |

### T12 — Pomodoro button visibility

|                      |                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | The pomodoro hourglass button is only visible when a timer is running.                                                         |
| **Preconditions**    | None.                                                                                                                          |
| **Steps**            | 1. With no timer running, observe the area next to the big timer. 2. Start a timer. 3. Observe the area again.                 |
| **Expected outcome** | When idle, the hourglass button is not visible. When the timer is running, the hourglass button appears next to the big timer. |
| **Actual outcome**   |                                                                                                                                |

## Comment field

### T13 — Comment field while timer is running

|                      |                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The comment field is editable while a timer is running.                                                                                        |
| **Preconditions**    | A timer is running.                                                                                                                            |
| **Steps**            | 1. While a timer is running, click the "Add comment" row at the bottom of the screen (or press **C**). 2. Type a comment. 3. Press **Enter**.  |
| **Expected outcome** | The comment input appears and gets focus. After pressing Enter, the comment is saved to the current time entry in Firestore. The input closes. |
| **Actual outcome**   |                                                                                                                                                |

### T14 — Comment field: Escape cancels without saving

|                      |                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Pressing Escape in the comment field closes it without saving changes.                                                |
| **Preconditions**    | A timer is running. The comment field is open.                                                                        |
| **Steps**            | 1. Open the comment field. 2. Type some text. 3. Press **Escape**.                                                    |
| **Expected outcome** | The comment field closes. The typed text is not saved to Firestore. The previous comment value (if any) is preserved. |
| **Actual outcome**   |                                                                                                                       |

### T15 — Comment carry-over from previous entry

|                      |                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | When starting a task, the comment from its most recent entry today is pre-populated.                                                                      |
| **Preconditions**    | A task has a previous time entry today with a saved comment.                                                                                              |
| **Steps**            | 1. Start a task that has a prior time entry with a comment today. 2. Open the comment field.                                                              |
| **Expected outcome** | The comment field is pre-populated with the comment from the task's most recent time entry today. The text is selected so the user can easily replace it. |
| **Actual outcome**   |                                                                                                                                                           |

### T16 — Comment field becomes read-only when timer stops

|                      |                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | When the timer stops, the comment field becomes read-only.                                                                           |
| **Preconditions**    | A timer is running with a saved comment.                                                                                             |
| **Steps**            | 1. While a timer is running, save a comment. 2. Stop the timer. 3. Observe the comment field area.                                   |
| **Expected outcome** | The comment field shows the saved comment as read-only text (not an editable input). It remains visible until a new task is started. |
| **Actual outcome**   |                                                                                                                                      |

## Task lifecycle

### T17 — Complete a task (checkbox)

|                      |                                                                                                                                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Checking the checkbox on a task completes it and stops the timer if running.                                                                                                                                                                                                      |
| **Preconditions**    | A task is active. Optionally, it is currently being timed.                                                                                                                                                                                                                        |
| **Steps**            | 1. Check the checkbox on an active task (that is currently running).                                                                                                                                                                                                              |
| **Expected outcome** | The timer stops (if it was running on this task). The task row shows strikethrough text. The task name is no longer clickable. The task's total today-duration is shown. An archive button appears. The task status in Firestore is `"completed"` with a `completedAt` timestamp. |
| **Actual outcome**   |                                                                                                                                                                                                                                                                                   |

### T18 — Uncomplete a task (uncheck checkbox)

|                      |                                                                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Unchecking a completed task reactivates it.                                                                                                                                      |
| **Preconditions**    | A completed task exists in the task list.                                                                                                                                        |
| **Steps**            | 1. Uncheck the checkbox on a completed task.                                                                                                                                     |
| **Expected outcome** | The task returns to active state. The strikethrough is removed. The task name becomes clickable again. In Firestore, `status` is set to `"active"` and `completedAt` is cleared. |
| **Actual outcome**   |                                                                                                                                                                                  |

### T19 — Archive a completed task

|                      |                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Clicking the archive button removes a completed task from the main screen.                                                            |
| **Preconditions**    | A completed task is visible in the task list (with archive button shown).                                                             |
| **Steps**            | 1. Click the archive (trash) button on a completed task.                                                                              |
| **Expected outcome** | The task disappears from the task list. In Firestore, `status` is set to `"archived"`. The task no longer appears on the main screen. |
| **Actual outcome**   |                                                                                                                                       |

### T20 — Auto-archive of completed tasks (next day)

|                      |                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Completed tasks from previous days are automatically hidden.                                                                          |
| **Preconditions**    | A task was completed yesterday (or earlier).                                                                                          |
| **Steps**            | 1. Complete a task. 2. Reload the app the next day (or simulate by changing the date filter logic).                                   |
| **Expected outcome** | Completed tasks whose `completedAt` is before today are not shown in the main task list. They still exist in Firestore (not deleted). |
| **Actual outcome**   |                                                                                                                                       |

## Keyboard shortcuts

### T21 — Keyboard shortcut: T opens Add Task form

|                      |                                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Pressing T (with no input focused) opens the Add Task form.                                                                                                               |
| **Preconditions**    | No input, select, or textarea element is focused.                                                                                                                         |
| **Steps**            | 1. Ensure no form field is focused. 2. Press the **T** key.                                                                                                               |
| **Expected outcome** | The Add Task form opens at the bottom of the screen. The task name input gets focus immediately. If the Add Project form was open, it closes (preserving any typed text). |
| **Actual outcome**   |                                                                                                                                                                           |

### T22 — Keyboard shortcut: P opens Add Project form

|                      |                                                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Pressing P (with no input focused) opens the Add Project form.                                                                                                               |
| **Preconditions**    | No input, select, or textarea element is focused.                                                                                                                            |
| **Steps**            | 1. Ensure no form field is focused. 2. Press the **P** key.                                                                                                                  |
| **Expected outcome** | The Add Project form opens at the bottom of the screen. The project name input gets focus immediately. If the Add Task form was open, it closes (preserving any typed text). |
| **Actual outcome**   |                                                                                                                                                                              |

### T23 — Keyboard shortcut: C opens Comment field

|                      |                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------- |
| **Scenario**         | Pressing C (with no input focused) opens the comment field.                             |
| **Preconditions**    | A timer is running or a task is active (stopped but resumable). No input is focused.    |
| **Steps**            | 1. Start a timer. 2. Click outside any input to remove focus. 3. Press the **C** key.   |
| **Expected outcome** | The comment field opens and gets focus. The existing comment text (if any) is selected. |
| **Actual outcome**   |                                                                                         |

### T24 — Keyboard shortcut: Escape closes open form

|                      |                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Pressing Escape closes whichever form or field is open.                                                  |
| **Preconditions**    | A form (Add Task, Add Project, or Comment) is open.                                                      |
| **Steps**            | 1. Open any form using its keyboard shortcut. 2. Press **Escape**.                                       |
| **Expected outcome** | The open form closes. No data is saved or lost (typed text is preserved for Add Task/Add Project forms). |
| **Actual outcome**   |                                                                                                          |

### T25 — Add Task with Ctrl+Enter starts timer immediately

|                      |                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | Pressing Ctrl+Enter (or Cmd+Enter on Mac) in the Add Task form saves and starts timing.                                                                      |
| **Preconditions**    | The Add Task form is open. A project is selected.                                                                                                            |
| **Steps**            | 1. Open the Add Task form. 2. Select a project. 3. Type a task name. 4. Press **Ctrl+Enter** (or **Cmd+Enter** on Mac).                                      |
| **Expected outcome** | The task is created in Firestore. A timer immediately starts for the new task. The task row appears in the list highlighted green. The Add Task form closes. |
| **Actual outcome**   |                                                                                                                                                              |

## Duplicate prevention and forms

### T26 — Duplicate project name prevention

|                      |                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Creating a project with a name that already exists (case-insensitive) shows an error.                   |
| **Preconditions**    | A project named "Project A" exists.                                                                     |
| **Steps**            | 1. Open the Add Project form. 2. Type "project a" (lowercase). 3. Submit.                               |
| **Expected outcome** | An inline error message appears indicating the project name already exists. The project is not created. |
| **Actual outcome**   |                                                                                                         |

### T27 — Duplicate task name prevention (within project)

|                      |                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Creating a task with a name that already exists within the same project shows an error.                           |
| **Preconditions**    | "Project A" has a task named "Design work".                                                                       |
| **Steps**            | 1. Open the Add Task form. 2. Select "Project A". 3. Type "design work" (lowercase). 4. Submit.                   |
| **Expected outcome** | An inline error message appears indicating the task name already exists in this project. The task is not created. |
| **Actual outcome**   |                                                                                                                   |

### T28 — Form coordination (only one form open at a time)

|                      |                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Opening one form closes the other, preserving typed text.                                                                                                     |
| **Preconditions**    | None.                                                                                                                                                         |
| **Steps**            | 1. Open Add Task form and type "my new task". 2. Open Add Project form (press **P** or click button). 3. Re-open Add Task form (press **T** or click button). |
| **Expected outcome** | When Add Project opens, Add Task closes. When Add Task re-opens, the previously typed text "my new task" is still there.                                      |
| **Actual outcome**   |                                                                                                                                                               |

## Drag-and-drop reordering

### T29 — Drag to reorder tasks within a project

|                      |                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Tasks can be reordered by dragging within their project group.                                                                |
| **Preconditions**    | A project has at least two tasks.                                                                                             |
| **Steps**            | 1. Drag the second task above the first task within the same project. 2. Release.                                             |
| **Expected outcome** | The tasks swap positions. The new order persists after page reload. The `order` field in Firestore is updated for both tasks. |
| **Actual outcome**   |                                                                                                                               |

### T30 — Drag to reorder projects

|                      |                                                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Projects (with all their tasks) can be reordered by dragging the project header.                                                                                            |
| **Preconditions**    | At least two projects exist with tasks.                                                                                                                                     |
| **Steps**            | 1. Drag the second project header above the first project. 2. Release.                                                                                                      |
| **Expected outcome** | The entire project block (header + tasks) moves to the new position. The new order persists after page reload. The `order` field in Firestore is updated for both projects. |
| **Actual outcome**   |                                                                                                                                                                             |

### T31 — Escape cancels drag reorder

|                      |                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------- |
| **Scenario**         | Pressing Escape during a drag cancels the reorder.                                          |
| **Preconditions**    | A drag operation is in progress.                                                            |
| **Steps**            | 1. Begin dragging a task or project. 2. While still dragging, press **Escape**.             |
| **Expected outcome** | The drag is cancelled. Items return to their original positions. No Firestore writes occur. |
| **Actual outcome**   |                                                                                             |

## State recovery and browser integration

### T32 — Timer recovery on page reload

|                      |                                                                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | Reloading the page while a timer is running recovers the timer state.                                                                                                                                                                                  |
| **Preconditions**    | A timer is currently running.                                                                                                                                                                                                                          |
| **Steps**            | 1. Start timing a task. 2. Wait at least 15 seconds. 3. Reload the page (F5 or Ctrl+R).                                                                                                                                                                |
| **Expected outcome** | After reload, the timer is still running for the same task. The elapsed time is calculated from the original `startTime` in Firestore (not reset to zero). The big timer shows the correct cumulative elapsed time. The task row is highlighted green. |
| **Actual outcome**   |                                                                                                                                                                                                                                                        |

### T33 — Browser title updates while timing

|                      |                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The browser tab title shows the running timer and task name.                                                                                      |
| **Preconditions**    | None.                                                                                                                                             |
| **Steps**            | 1. Start timing a task named "Design work". 2. Observe the browser tab title. 3. Stop the timer. 4. Observe the title again.                      |
| **Expected outcome** | While running: the tab title shows `[H:MM:SS] Design work - SlickTimer` and updates every second. When stopped: the title resets to `SlickTimer`. |
| **Actual outcome**   |                                                                                                                                                   |

## Notifications

### T34 — Idle notification after 15 minutes

|                      |                                                                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | If no timer runs for 15 minutes, a browser notification prompts the user.                                                                                      |
| **Preconditions**    | Browser notification permission is granted. No timer is running.                                                                                               |
| **Steps**            | 1. Stop any running timer. 2. Wait 15 minutes without starting a new timer.                                                                                    |
| **Expected outcome** | A browser notification appears: "SlickTimer - You haven't been timing for 15 minutes." The notification fires once until a timer is started and stopped again. |
| **Actual outcome**   |                                                                                                                                                                |

### T35 — Notification permission request on first load

|                      |                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The app requests notification permission when the user first authenticates.                                                                                             |
| **Preconditions**    | Browser notification permission is in "default" state (not yet granted or denied).                                                                                      |
| **Steps**            | 1. Clear notification permissions for the app's origin. 2. Log in.                                                                                                      |
| **Expected outcome** | The browser prompts for notification permission. If granted, idle and pomodoro notifications will work. If denied, the app continues to function without notifications. |
| **Actual outcome**   |                                                                                                                                                                         |

## Other

### T36 — Inline tag parsing with # syntax

|                      |                                                                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Tags can be added to tasks using `#tag` syntax in the task name input.                                                                                                              |
| **Preconditions**    | The Add Task form is open with a project selected.                                                                                                                                  |
| **Steps**            | 1. In the task name field, type "Design homepage #billable #frontend". 2. Submit the form.                                                                                          |
| **Expected outcome** | A task named "Design homepage" is created with tags `["billable", "frontend"]`. The `#billable` and `#frontend` portions are parsed out of the name and stored in the `tags` array. |
| **Actual outcome**   |                                                                                                                                                                                     |

### T37 — Completed task shows duration but is not clickable

|                      |                                                                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Completed tasks display their today-duration but cannot be timed.                                                                                                                      |
| **Preconditions**    | A completed task exists with time entries from today.                                                                                                                                  |
| **Steps**            | 1. Complete a task that has entries today. 2. Observe the task row. 3. Try to click the task name.                                                                                     |
| **Expected outcome** | The task row shows the total duration for today. The task name has strikethrough styling. Clicking the name does not start a timer (the name is not clickable / has no click handler). |
| **Actual outcome**   |                                                                                                                                                                                        |

### T38 — Previous task duration disappears when switching tasks

|                      |                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | When a different task is started, the previous task's inline duration disappears.                                      |
| **Preconditions**    | Task A has been running and accumulating duration. Task B exists.                                                      |
| **Steps**            | 1. Start timing Task A. Let it run for 15+ seconds. 2. Click Task B to switch. 3. Observe Task A's row.                |
| **Expected outcome** | Task A's inline duration display disappears (it is no longer the active task). Only Task B shows its running duration. |
| **Actual outcome**   |                                                                                                                        |

### T39 — Big timer color: green when running, grey when idle

|                      |                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The big timer clock changes color based on state.                                                                                                           |
| **Preconditions**    | None.                                                                                                                                                       |
| **Steps**            | 1. Observe the big timer when no timer is running. 2. Start a timer. 3. Observe the color. 4. Stop the timer.                                               |
| **Expected outcome** | Idle: the timer text is grey. Running: the timer text turns green (`timer-active` color). Pomodoro overtime: the timer turns orange (`notification` color). |
| **Actual outcome**   |                                                                                                                                                             |

### T40 — Login and logout flow

|                      |                                                                                                                                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Users can log in, see their data, and the app redirects unauthenticated users.                                                                                                                                                                           |
| **Preconditions**    | A test account exists (email/password or Google).                                                                                                                                                                                                        |
| **Steps**            | 1. Navigate to `/timer` while logged out. 2. Verify redirect to login page. 3. Log in with credentials. 4. Verify redirect to `/timer` with user's projects/tasks. 5. Log out (if logout UI exists) or clear auth state.                                 |
| **Expected outcome** | Unauthenticated users navigating to `/timer` are redirected to `/login`. After login, the user is redirected to `/timer` and sees their own projects and tasks. The Home page at `/` is accessible without authentication. Each user's data is isolated. |
| **Actual outcome**   |                                                                                                                                                                                                                                                          |

## Edit time entries

### T41 — Navigate to entries page and see today's entries

|                      |                                                                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | The entries page shows today's time entries in chronological order.                                                                                                                                                                              |
| **Preconditions**    | At least one completed time entry exists for today.                                                                                                                                                                                              |
| **Steps**            | 1. Click "Entries" in the nav bar.                                                                                                                                                                                                               |
| **Expected outcome** | The entries page loads showing today's date. Time entries are listed in chronological order (earliest first). Each entry shows start time, end time, duration, task name, project name, tags, and comment. A daily total is shown at the bottom. |
| **Actual outcome**   |                                                                                                                                                                                                                                                  |

### T42 — Navigate between days

|                      |                                                                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Clicking the previous/next arrows changes the displayed day.                                                                                                                  |
| **Preconditions**    | Time entries exist on at least two different days.                                                                                                                            |
| **Steps**            | 1. On the entries page, click the left arrow to go to the previous day. 2. Click the right arrow to return.                                                                   |
| **Expected outcome** | The date header updates. Entries for the selected day are shown. If no entries exist for a day, "No entries for this day." is displayed. The daily total updates accordingly. |
| **Actual outcome**   |                                                                                                                                                                               |

### T43 — Create a new manual time entry

|                      |                                                                                                                                                                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | A new time entry can be created manually for any day.                                                                                                                                                                                                                            |
| **Preconditions**    | At least one active task exists.                                                                                                                                                                                                                                                 |
| **Steps**            | 1. Click "+ New Entry". 2. Select a task from the dropdown. 3. Enter a start time (e.g. "09:00:00") and end time (e.g. "09:30:00"). 4. Optionally add a comment. 5. Click "Save".                                                                                                |
| **Expected outcome** | The new entry appears in the list at the correct chronological position. The daily total updates. The form closes and resets. The entry is saved to Firestore with the correct `date`, `taskId`, `projectId`, `duration`, `tags` (inherited from task), `comment`, and `userId`. |
| **Actual outcome**   |                                                                                                                                                                                                                                                                                  |

### T44 — New entry form validation

|                      |                                                                                                                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The new entry form validates required fields and minimum duration.                                                                                                                                                                      |
| **Preconditions**    | The new entry form is open.                                                                                                                                                                                                             |
| **Steps**            | 1. Click Save without filling in any fields. 2. Fill in times but leave task empty. 3. Enter start and end times less than 10 seconds apart.                                                                                            |
| **Expected outcome** | Each case shows an appropriate inline error message. No entry is created. Errors: "Please select a task.", "Please enter start and end times.", "Duration must be at least 10 seconds."                                                  |
| **Actual outcome**   |                                                                                                                                                                                                                                         |

### T45 — Cancel new entry form

|                      |                                                                           |
| -------------------- | ------------------------------------------------------------------------- |
| **Scenario**         | Clicking Cancel closes the new entry form without saving.                 |
| **Preconditions**    | The new entry form is open with data entered.                             |
| **Steps**            | 1. Open the new entry form. 2. Fill in some fields. 3. Click "Cancel".    |
| **Expected outcome** | The form closes. No entry is created. The "+ New Entry" button reappears. |
| **Actual outcome**   |                                                                           |

### T46 — Edit an existing time entry

|                      |                                                                                                                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | Editing a time entry updates its start time, end time, and comment.                                                                                                                                                                                          |
| **Preconditions**    | At least one completed time entry exists for the selected day.                                                                                                                                                                                               |
| **Steps**            | 1. Click "Edit" on an existing entry. 2. Change the start time using the time picker (e.g. from 09:00 to 09:05). 3. Change the comment. 4. Click "Save".                                                                                                      |
| **Expected outcome** | The inline edit form shows native time pickers with the entry's current values pre-filled in HH:MM format. After saving, the entry updates in the list with the new times and comment. The duration recalculates. The daily total updates. The entry is updated in Firestore. |
| **Actual outcome**   |                                                                                                                                                                                                                                                              |

### T47 — Edit entry validation

|                      |                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Editing an entry validates the minimum duration and time format.                                                                                     |
| **Preconditions**    | The edit form is open for an existing entry.                                                                                                         |
| **Steps**            | 1. Change start and end times to be less than 10 seconds apart. 2. Click Save.                                                                        |
| **Expected outcome** | An inline error message appears: "Duration must be at least 10 seconds." The entry is not updated.                                                    |
| **Actual outcome**   |                                                                                                                                                      |

### T48 — Cancel edit entry

|                      |                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------- |
| **Scenario**         | Clicking Cancel on the edit form discards changes.                                       |
| **Preconditions**    | The edit form is open for an existing entry with changes made.                           |
| **Steps**            | 1. Click "Edit" on an entry. 2. Modify the start time. 3. Click "Cancel".                |
| **Expected outcome** | The edit form closes. The entry retains its original values. No Firestore update occurs. |
| **Actual outcome**   |                                                                                          |

### T49 — Delete a time entry

|                      |                                                                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Deleting a time entry removes it from the list and Firestore.                                                                                                                      |
| **Preconditions**    | At least one completed time entry exists.                                                                                                                                          |
| **Steps**            | 1. Click "Del" on an entry. 2. Confirm by clicking "Yes".                                                                                                                          |
| **Expected outcome** | An inline confirmation appears: "Delete this entry? Yes / No". After confirming, the entry disappears from the list. The daily total updates. The entry is deleted from Firestore. |
| **Actual outcome**   |                                                                                                                                                                                    |

### T50 — Cancel delete entry

|                      |                                                                              |
| -------------------- | ---------------------------------------------------------------------------- |
| **Scenario**         | Clicking "No" on the delete confirmation cancels the deletion.               |
| **Preconditions**    | The delete confirmation is showing for an entry.                             |
| **Steps**            | 1. Click "Del" on an entry. 2. Click "No".                                   |
| **Expected outcome** | The confirmation disappears. The entry remains in the list and in Firestore. |
| **Actual outcome**   |                                                                              |

### T51 — Running entry shown with "(running)" indicator

|                      |                                                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | A currently running time entry is displayed with a "(running)" indicator instead of an end time.                                                                                             |
| **Preconditions**    | A timer is currently running (started from the timer page).                                                                                                                                  |
| **Steps**            | 1. Start a timer on the timer page. 2. Navigate to the entries page.                                                                                                                         |
| **Expected outcome** | The running entry appears in the list with its start time and a green "(running)" label instead of an end time. No Edit or Del buttons are shown for running entries (or they are disabled). |
| **Actual outcome**   |                                                                                                                                                                                              |

### T52 — Daily total accuracy

|                      |                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The daily total at the bottom sums only completed entries.                                                                              |
| **Preconditions**    | Multiple completed time entries exist for today, and optionally a running entry.                                                        |
| **Steps**            | 1. View the entries page for today. 2. Note the daily total. 3. Manually sum the durations of all completed entries.                    |
| **Expected outcome** | The displayed total matches the manual sum. Running entries are not included in the total. The total format is "Xh Ym" (e.g. "2h 15m"). |
| **Actual outcome**   |                                                                                                                                         |

## Navigation

### T53 — Home page nav when logged out

|                      |                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The Home page shows a minimal nav with Login when not authenticated.                                                                                      |
| **Preconditions**    | User is not logged in.                                                                                                                                    |
| **Steps**            | 1. Navigate to `/`.                                                                                                                                       |
| **Expected outcome** | The blue nav bar shows "Home" as the active tab and "Login" at the far right. No other nav links are shown. The Getting Started content is visible below. |
| **Actual outcome**   |                                                                                                                                                           |

### T54 — Home page nav when logged in

|                      |                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The Home page shows the full nav when authenticated.                                                                                                      |
| **Preconditions**    | User is logged in.                                                                                                                                        |
| **Steps**            | 1. Navigate to `/`.                                                                                                                                       |
| **Expected outcome** | The blue nav bar shows Home (active), Entries, Tasks, Projects, Reports links, and Logout at the far right. The Getting Started content is visible below. |
| **Actual outcome**   |                                                                                                                                                           |

### T55 — Timer page nav (Manage Data / Run Reports)

|                      |                                                                                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | The timer page shows a custom nav with Manage Data, Run Reports, and Logout.                                                                                                                                                               |
| **Preconditions**    | User is logged in.                                                                                                                                                                                                                         |
| **Steps**            | 1. Open the timer via "Open Timer" on the Home page. 2. Click "Manage Data". 3. Click "Run Reports".                                                                                                                                      |
| **Expected outcome** | The timer nav shows "Manage Data", "Run Reports" (left), and "Logout" (right). Clicking "Manage Data" opens `/entries` in the main browser window. Clicking "Run Reports" opens `/reports` in the main browser window. No "Home" link shown. |
| **Actual outcome**   |                                                                                                                                                                                                                                            |

### T56 — Nav links navigate correctly

|                      |                                                                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | All nav links navigate to their correct pages.                                                                                                                 |
| **Preconditions**    | User is logged in.                                                                                                                                             |
| **Steps**            | 1. From any non-timer page, click each nav link: Home, Entries, Tasks, Projects, Reports. 2. Verify the correct page loads and the active tab updates.          |
| **Expected outcome** | Home→`/`, Entries→`/entries`, Tasks→`/tasks`, Projects→`/projects`, Reports→`/reports`. The clicked link becomes the active tab (white background, grey text). |
| **Actual outcome**   |                                                                                                                                                                |

### T57 — Tasks and Projects stub pages

|                      |                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Tasks and Projects pages show stub content.                                                                                             |
| **Preconditions**    | User is logged in.                                                                                                                      |
| **Steps**            | 1. Navigate to `/tasks`. 2. Navigate to `/projects`.                                                                                    |
| **Expected outcome** | Each page shows a centered heading ("Tasks" or "Projects") with "Coming soon." text below it. The nav bar shows the correct active tab. |
| **Actual outcome**   |                                                                                                                                         |

### T58 — Unauthenticated access to protected pages

|                      |                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Unauthenticated users are redirected to login for all protected pages.                                                              |
| **Preconditions**    | User is not logged in.                                                                                                              |
| **Steps**            | 1. Navigate to `/timer`. 2. Navigate to `/entries`. 3. Navigate to `/tasks`. 4. Navigate to `/projects`. 5. Navigate to `/reports`. |
| **Expected outcome** | All five pages redirect to `/login`.                                                                                                |
| **Actual outcome**   |                                                                                                                                     |
