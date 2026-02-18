
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
  - [T39 — Timer bar background color changes with state](#t39--timer-bar-background-color-changes-with-state)
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
  - [T87 — Entry tags: all three tag sources displayed](#t87--entry-tags-all-three-tag-sources-displayed)
  - [T88 — Entry tags: "No tags" when nothing anywhere](#t88--entry-tags-no-tags-when-nothing-anywhere)
  - [T89 — Entry tags: duplicates shown per section](#t89--entry-tags-duplicates-shown-per-section)
- [Navigation](#navigation)
  - [T53 — Home page nav when logged out](#t53--home-page-nav-when-logged-out)
  - [T54 — Home page nav when logged in](#t54--home-page-nav-when-logged-in)
  - [T55 — Timer page nav (Edit Entries / Run Reports)](#t55--timer-page-nav-edit-entries--run-reports)
  - [T56 — Nav links navigate correctly](#t56--nav-links-navigate-correctly)
  - [T57 — Edit Tasks and Edit Projects pages load correctly](#t57--edit-tasks-and-edit-projects-pages-load-correctly)
  - [T58 — Unauthenticated access to protected pages](#t58--unauthenticated-access-to-protected-pages)
- [Entry form keyboard shortcuts](#entry-form-keyboard-shortcuts)
  - [T59 — Ctrl+Enter saves new entry form](#t59--ctrlenter-saves-new-entry-form)
  - [T60 — Ctrl+Enter saves edit entry form](#t60--ctrlenter-saves-edit-entry-form)
  - [T61 — Auto-save on day navigation](#t61--auto-save-on-day-navigation)
  - [T62 — Auto-save blocked on invalid form](#t62--auto-save-blocked-on-invalid-form)
  - [T63 — New entry seconds are :00 and :59](#t63--new-entry-seconds-are-00-and-59)
  - [T64 — Edit preserves original seconds when time unchanged](#t64--edit-preserves-original-seconds-when-time-unchanged)
  - [T65 — Edit sets :00/:59 seconds when time changed](#t65--edit-sets-0059-seconds-when-time-changed)
- [Edit Tasks](#edit-tasks)
  - [T66 — Tasks page shows tasks grouped by project](#t66--tasks-page-shows-tasks-grouped-by-project)
  - [T67 — Show/hide archived tasks toggle](#t67--showhide-archived-tasks-toggle)
  - [T68 — Edit task name inline](#t68--edit-task-name-inline)
  - [T69 — Edit task project (move to different project)](#t69--edit-task-project-move-to-different-project)
  - [T70 — Edit task tags inline](#t70--edit-task-tags-inline)
  - [T71 — Complete a task via checkbox on Edit Tasks page](#t71--complete-a-task-via-checkbox-on-edit-tasks-page)
  - [T72 — Uncomplete a task via checkbox](#t72--uncomplete-a-task-via-checkbox)
  - [T73 — Archive a task (active or completed)](#t73--archive-a-task-active-or-completed)
  - [T74 — Cannot archive or complete a running task](#t74--cannot-archive-or-complete-a-running-task)
  - [T75 — Un-archive a task](#t75--un-archive-a-task)
  - [T76 — Delete task with time entry count confirmation](#t76--delete-task-with-time-entry-count-confirmation)
- [Edit Projects](#edit-projects)
  - [T77 — Projects page shows all projects](#t77--projects-page-shows-all-projects)
  - [T78 — Edit project name and color inline](#t78--edit-project-name-and-color-inline)
  - [T79 — Edit project tags inline](#t79--edit-project-tags-inline)
  - [T80 — Complete all tasks in a project](#t80--complete-all-tasks-in-a-project)
  - [T81 — Archive all tasks in a project](#t81--archive-all-tasks-in-a-project)
  - [T82 — Cannot complete/archive-all if a task is running](#t82--cannot-completearchive-all-if-a-task-is-running)
  - [T83 — Delete project: type-to-confirm, shows impact count](#t83--delete-project-type-to-confirm-shows-impact-count)
  - [T84 — Delete project: button disabled until name matches](#t84--delete-project-button-disabled-until-name-matches)
  - [T85 — Edit project: auto-save when switching to another project's edit form](#t85--edit-project-auto-save-when-switching-to-another-projects-edit-form)
  - [T86 — Edit project: no Firestore write when nothing changed](#t86--edit-project-no-firestore-write-when-nothing-changed)

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
| **Expected outcome** | The timer starts **immediately** (optimistic UI — no waiting for Firestore). The big timer clock turns green and begins counting up. The clicked task row is highlighted green. A time entry document is created in Firestore in the background with `endTime: null`. The browser title updates to `[HH:MM:SS] Task Name - SlickTimer`. |
| **Actual outcome**   |                                                                                                                                                                                                                                                            |

### T02 — Stop a timer by clicking the running task

|                      |                                                                                                                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | Clicking the currently running task stops the timer.                                                                                                                                                                                                                     |
| **Preconditions**    | A timer is running on a task.                                                                                                                                                                                                                                            |
| **Steps**            | 1. Click the name of the currently running (green-highlighted) task.                                                                                                                                                                                                     |
| **Expected outcome** | The timer stops **immediately** (optimistic UI). The timer bar turns amber (paused state). The task row loses its green highlight and turns amber (active-but-stopped). The time entry in Firestore is updated with `endTime` and `duration` in the background. The browser title resets to `SlickTimer`. |
| **Actual outcome**   |                                                                                                                                                                                                                                                                          |

### T03 — Switch timer to a different task

|                      |                                                                                                                                                                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Clicking a different task stops the current timer and starts a new one.                                                                                                                                                                                                             |
| **Preconditions**    | A timer is running on Task A. Task B exists in the task list.                                                                                                                                                                                                                       |
| **Steps**            | 1. While Task A is timing, click Task B.                                                                                                                                                                                                                                            |
| **Expected outcome** | Both changes happen **immediately** (optimistic UI). Task A's timer stops and Task B's timer starts with no perceptible delay. The green highlight moves from Task A to Task B instantly. The big timer resets and starts counting from 0:00:00 for Task B. Firestore writes for both entries happen in the background. The browser title shows Task B's name. |
| **Actual outcome**   |                                                                                                                                                                                                                                                                                     |

### T04 — Play/Pause button resumes the last active task

|                      |                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The play button resumes timing the most recently active task.                                                                                                          |
| **Preconditions**    | A timer was running and was stopped (the timer bar and task row show an amber tint — paused state).                                                                    |
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

### T39 — Timer bar background color changes with state

|                      |                                                                                                                                                                                                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The timer bar background and border color reflects the current timer state.                                                                                                                                                                                                                                                                  |
| **Preconditions**    | None.                                                                                                                                                                                                                                                                                                                                        |
| **Steps**            | 1. Open the timer with no task selected. 2. Click a task to select it without starting (paused state). 3. Start the timer. 4. Stop the timer (task remains selected). 5. Pomodoro: start a timer, enable pomodoro, wait for overtime.                                                                                                         |
| **Expected outcome** | Stopped (no task selected): salmon background (`#ffcebe`) with salmon-red border (`#c56346`). Paused (task selected, timer stopped): amber background (`#fff3bf`) with amber border (`#c9a227`). Running: green background (`#ccffbf`) with green border (`#55c933`). Pomodoro overtime: timer text turns orange; bar background remains green. |
| **Actual outcome**   |                                                                                                                                                                                                                                                                                                                                              |

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
| **Expected outcome** | The entries page loads showing today's date in the center of the header. "+ New Entry" is at the far left, entry count and total time at the far right. Time entries are listed in chronological order (earliest first) in rounded light-blue boxes. Each entry uses a compact 3-column layout: left — task name (bold) and project name on the same line, tags and comment below; middle — time range and duration; right — Edit · Delete buttons on one line. |
| **Actual outcome**   |                                                                                                                                                                                                                                                  |

### T42 — Navigate between days

|                      |                                                                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Clicking the previous/next arrows changes the displayed day.                                                                                                                  |
| **Preconditions**    | Time entries exist on at least two different days.                                                                                                                            |
| **Steps**            | 1. On the entries page, click the left arrow to go to the previous day. 2. Click the right arrow to return.                                                                   |
| **Expected outcome** | The date header updates. Entries for the selected day are shown. If no entries exist for a day, "No entries for this day." is displayed. The daily total updates accordingly. When viewing today, the label reads "Today · [weekday]" (e.g. "Today · Wed"). Yesterday shows "Yesterday · Tue", tomorrow shows "Tomorrow · Thu". All other dates show the locale-formatted date (e.g. "Mon, Feb 16, 2026" in en-US). |
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
| **Scenario**         | Clicking Cancel or pressing Escape closes the new entry form without saving. |
| **Preconditions**    | The new entry form is open with data entered.                                |
| **Steps**            | 1. Open the new entry form. 2. Fill in some fields. 3. Click "Cancel". 4. Open the form again. 5. Press **Escape**. |
| **Expected outcome** | In both cases, the form closes. No entry is created. The "+ New Entry" link reappears. |
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
| **Scenario**         | Clicking Cancel or pressing Escape on the edit form discards changes.                                   |
| **Preconditions**    | The edit form is open for an existing entry with changes made.                                          |
| **Steps**            | 1. Click "Edit" on an entry. 2. Modify the start time. 3. Click "Cancel". 4. Click "Edit" again. 5. Press **Escape**. |
| **Expected outcome** | In both cases, the edit form closes. The entry retains its original values. No Firestore update occurs. |
| **Actual outcome**   |                                                                                          |

### T49 — Delete a time entry

|                      |                                                                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Deleting a time entry removes it from the list and Firestore.                                                                                                                      |
| **Preconditions**    | At least one completed time entry exists.                                                                                                                                          |
| **Steps**            | 1. Click "Delete" on an entry. 2. Confirm by clicking "Yes".                                                                                                                       |
| **Expected outcome** | An inline confirmation appears: "Delete this entry? Yes / No". After confirming, the entry disappears from the list. The daily total updates. The entry is deleted from Firestore. |
| **Actual outcome**   |                                                                                                                                                                                    |

### T50 — Cancel delete entry

|                      |                                                                              |
| -------------------- | ---------------------------------------------------------------------------- |
| **Scenario**         | Clicking "No" or pressing Escape on the delete confirmation cancels the deletion. |
| **Preconditions**    | The delete confirmation is showing for an entry.                                  |
| **Steps**            | 1. Click "Delete" on an entry. 2. Click "No". 3. Click "Delete" again. 4. Press **Escape**. |
| **Expected outcome** | In both cases, the confirmation disappears. The entry remains in the list and in Firestore. |
| **Actual outcome**   |                                                                              |

### T51 — Running entry shown with "(running)" indicator

|                      |                                                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | A currently running time entry is displayed with a "(running)" indicator instead of an end time.                                                                                             |
| **Preconditions**    | A timer is currently running (started from the timer page).                                                                                                                                  |
| **Steps**            | 1. Start a timer on the timer page. 2. Navigate to the entries page.                                                                                                                         |
| **Expected outcome** | The running entry appears in the list with its start time and a green "(running)" label instead of an end time. No Edit or Delete buttons are shown for running entries (or they are disabled). |
| **Actual outcome**   |                                                                                                                                                                                              |

### T52 — Daily total accuracy

|                      |                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The daily total sums only completed entries and durations round to the nearest minute.                                                                              |
| **Preconditions**    | Multiple completed time entries exist for today, including one short entry (e.g. 13:55:00–13:55:59 = 59 seconds). A running entry may also exist. |
| **Steps**            | 1. View the entries page for today. 2. Note the duration shown for the short (59-second) entry. 3. Note the daily total.                           |
| **Expected outcome** | The 59-second entry shows "1m" (rounded up). The daily total rounds the full sum to the nearest minute. Running entries are not included. Format is "Xh Ym" or "Ym". |
| **Actual outcome**   |                                                                                                                                         |

### T87 — Entry tags: all three tag sources displayed

|                      |                                                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | A time entry with its own tags, a parent task with tags, and a parent project with tags shows all three sources in the tags line.                                              |
| **Preconditions**    | A project tagged `#client` has a task tagged `#billable`. A time entry on that task has tag `#urgent`. Navigate to the entries page and find that entry.                       |
| **Steps**            | 1. View the entry row. 2. Observe the tags line below the task/project names.                                                                                                  |
| **Expected outcome** | The tags line reads: `#urgent · From Task: #billable · From Project: #client`. All three sections appear in order, separated by `·`.                                           |
| **Actual outcome**   |                                                                                                                                                                                |

### T88 — Entry tags: "No tags" when nothing anywhere

|                      |                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | A time entry with no entry-level tags, on a task with no tags, in a project with no tags shows "No tags".                                                           |
| **Preconditions**    | A project with no tags has a task with no tags. A time entry on that task also has no tags. Navigate to the entries page.                                            |
| **Steps**            | 1. Find the entry with no tags. 2. Observe the tags line.                                                                                                            |
| **Expected outcome** | The tags line shows "No tags" in muted text.                                                                                                                         |
| **Actual outcome**   |                                                                                                                                                                      |

### T89 — Entry tags: duplicates shown per section

|                      |                                                                                                                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | When the same tag appears at the entry level, task level, and project level, it is shown in each section separately rather than de-duplicated.                                           |
| **Preconditions**    | A project tagged `#billable` has a task also tagged `#billable`. A time entry on that task is also tagged `#billable`. Navigate to the entries page.                                     |
| **Steps**            | 1. Find the entry. 2. Observe the tags line.                                                                                                                                             |
| **Expected outcome** | The tags line reads: `#billable · From Task: #billable · From Project: #billable`. The tag appears once per section — no de-duplication occurs across sections.                         |
| **Actual outcome**   |                                                                                                                                                                                          |

## Navigation

### T53 — Home page nav when logged out

|                      |                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The Home page shows a minimal nav with Login when not authenticated.                                                                                      |
| **Preconditions**    | User is not logged in.                                                                                                                                    |
| **Steps**            | 1. Navigate to `/`.                                                                                                                                       |
| **Expected outcome** | The blue nav bar shows "Home" as the active tab and "Login" at the far right. No other nav links are shown. The marketing copy is visible below with a "start the clock" link. |
| **Actual outcome**   |                                                                                                                                                           |

### T54 — Home page nav when logged in

|                      |                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The Home page shows the full nav when authenticated.                                                                                                      |
| **Preconditions**    | User is logged in.                                                                                                                                        |
| **Steps**            | 1. Navigate to `/`.                                                                                                                                       |
| **Expected outcome** | The blue nav bar shows Home (active), Edit Entries, Edit Tasks, Edit Projects, Run Reports links, Open Timer and Logout at the far right. The marketing copy is visible below. |
| **Actual outcome**   |                                                                                                                                                           |

### T55 — Timer page nav (Edit Entries / Run Reports)

|                      |                                                                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | The timer page shows a custom nav with Edit Entries, Run Reports, and Logout.                                                                                                                                                                    |
| **Preconditions**    | User is logged in.                                                                                                                                                                                                                               |
| **Steps**            | 1. Open the timer via "Open Timer" on the Home page. 2. Click "Edit Entries". 3. Click "Run Reports".                                                                                                                                            |
| **Expected outcome** | The timer nav shows "Edit Entries", "Run Reports" (left), and "Logout" (right). Clicking "Edit Entries" opens `/entries` in the main browser window. Clicking "Run Reports" opens `/reports` in the main browser window. No "Home" link shown. |
| **Actual outcome**   |                                                                                                                                                                                                                                                  |

### T56 — Nav links navigate correctly

|                      |                                                                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | All nav links navigate to their correct pages.                                                                                                                 |
| **Preconditions**    | User is logged in.                                                                                                                                             |
| **Steps**            | 1. From any non-timer page, click each nav link: Home, Entries, Tasks, Projects, Reports. 2. Click "Open Timer". 3. Verify the correct page loads and the active tab updates. |
| **Expected outcome** | Home→`/`, Edit Entries→`/entries`, Edit Tasks→`/tasks`, Edit Projects→`/projects`, Run Reports→`/reports`. The clicked link becomes the active tab (white background, grey text). "Open Timer" opens `/timer` in a popup window (not in the current tab). |
| **Actual outcome**   |                                                                                                                                                                |

### T57 — Edit Tasks and Edit Projects pages load correctly

|                      |                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Edit Tasks and Edit Projects pages load with real data.                                                                                                       |
| **Preconditions**    | User is logged in with at least one project and task.                                                                                                         |
| **Steps**            | 1. Navigate to `/tasks`. 2. Navigate to `/projects`.                                                                                                          |
| **Expected outcome** | `/tasks` shows tasks grouped by project with checkboxes and Edit · Archive · Delete buttons. `/projects` shows each project with a color swatch, task counts, and actions. |
| **Actual outcome**   |                                                                                                                                                               |

### T58 — Unauthenticated access to protected pages

|                      |                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Unauthenticated users are redirected to login for all protected pages.                                                              |
| **Preconditions**    | User is not logged in.                                                                                                              |
| **Steps**            | 1. Navigate to `/timer`. 2. Navigate to `/entries`. 3. Navigate to `/tasks`. 4. Navigate to `/projects`. 5. Navigate to `/reports`. |
| **Expected outcome** | All five pages redirect to `/login`.                                                                                                |
| **Actual outcome**   |                                                                                                                                     |

## Entry form keyboard shortcuts

### T59 — Ctrl+Enter saves new entry form

|                      |                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Pressing Ctrl+Enter (or Cmd+Enter on Mac) saves the new entry form.                                                                                                 |
| **Preconditions**    | The new entry form is open with valid data entered (task selected, start and end times).                                                                             |
| **Steps**            | 1. Click "+ New Entry". 2. Select a task, enter start time 09:00 and end time 09:30. 3. Press **Ctrl+Enter** (or **Cmd+Enter** on Mac).                              |
| **Expected outcome** | The entry is saved. The form closes. The new entry appears in the list.                                                                                              |
| **Actual outcome**   |                                                                                                                                                                      |

### T60 — Ctrl+Enter saves edit entry form

|                      |                                                                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Pressing Ctrl+Enter (or Cmd+Enter on Mac) saves the edit entry form.                                                                    |
| **Preconditions**    | The edit form is open for an existing entry.                                                                                             |
| **Steps**            | 1. Click "Edit" on an entry. 2. Change the comment text. 3. Press **Ctrl+Enter** (or **Cmd+Enter** on Mac).                             |
| **Expected outcome** | The entry is updated. The edit form closes. The updated comment appears in the entry row.                                                |
| **Actual outcome**   |                                                                                                                                          |

### T61 — Auto-save on day navigation

|                      |                                                                                                                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Navigating to the previous or next day auto-saves the open form.                                                                                                                                                |
| **Preconditions**    | An edit or new entry form is open with valid data.                                                                                                                                                              |
| **Steps**            | 1. Open the new entry form and fill in valid data (task, start 09:00, end 09:30). 2. Click the right arrow to go to the next day.                                                                               |
| **Expected outcome** | The form is saved before navigating. The entry appears in the previous day's list. The next day's entries are shown.                                                                                             |
| **Actual outcome**   |                                                                                                                                                                                                                 |

### T62 — Auto-save blocked on invalid form

|                      |                                                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Navigating to another day is blocked when the open form has validation errors.                                                            |
| **Preconditions**    | The new entry form is open with invalid data (e.g. no task selected).                                                                     |
| **Steps**            | 1. Open the new entry form. 2. Enter start and end times but do not select a task. 3. Click the left arrow to go to the previous day.     |
| **Expected outcome** | Navigation is blocked. The validation error "Please select a task." is shown. The date does not change.                                   |
| **Actual outcome**   |                                                                                                                                           |

### T63 — New entry seconds are :00 and :59

|                      |                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | New entries save start time with :00 seconds and end time with :59 seconds.                                                                                                |
| **Preconditions**    | At least one active task exists.                                                                                                                                           |
| **Steps**            | 1. Create a new entry with start 09:00 and end 09:30. 2. Check Firestore for the created entry.                                                                           |
| **Expected outcome** | The `startTime` Timestamp has seconds = 00. The `endTime` Timestamp has seconds = 59. The duration is 1859 seconds (30 min 59 sec), not 1800.                             |
| **Actual outcome**   |                                                                                                                                                                            |

### T64 — Edit preserves original seconds when time unchanged

|                      |                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Editing an entry without changing start/end times preserves the original seconds.                                                                                           |
| **Preconditions**    | An entry exists with specific seconds values (e.g. startTime at :15 seconds).                                                                                              |
| **Steps**            | 1. Click "Edit" on an entry. 2. Change only the comment. 3. Click "Save". 4. Check Firestore.                                                                             |
| **Expected outcome** | The `startTime` and `endTime` seconds are unchanged from their original values. Only the comment is updated.                                                               |
| **Actual outcome**   |                                                                                                                                                                            |

### T65 — Edit sets :00/:59 seconds when time changed

|                      |                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Editing an entry and changing a time field applies :00 (start) or :59 (end) seconds.                                                                                       |
| **Preconditions**    | An entry exists.                                                                                                                                                           |
| **Steps**            | 1. Click "Edit" on an entry. 2. Change the start time to a different value. 3. Leave the end time unchanged. 4. Click "Save". 5. Check Firestore.                         |
| **Expected outcome** | The `startTime` seconds are 00 (because start time was changed). The `endTime` seconds are unchanged (because end time was not changed).                                   |
| **Actual outcome**   |                                                                                                                                                                            |

## Edit Tasks

### T66 — Tasks page shows tasks grouped by project

|                      |                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The Edit Tasks page shows all tasks grouped under their project, with project tags and entry stats.                                                                                   |
| **Preconditions**    | User is logged in with at least two projects and several tasks, some with time entries.                                                                                               |
| **Steps**            | 1. Navigate to `/tasks`.                                                                                                                                                              |
| **Expected outcome** | Each project appears as a section header (color swatch + project name + project tags). Tasks appear below with a checkbox, name, tags, entry count + total time, and action buttons. |
| **Actual outcome**   |                                                                                                                                                    |

### T67 — Show/hide archived tasks toggle

|                      |                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Archived tasks are hidden by default and revealed by the toggle.                                                            |
| **Preconditions**    | At least one archived task exists.                                                                                          |
| **Steps**            | 1. Navigate to `/tasks`. 2. Confirm archived tasks are not shown. 3. Click "Show archived". 4. Click "Hide archived".       |
| **Expected outcome** | Archived tasks appear with muted/italic "archived" label when toggle is on, and disappear when toggled off.                 |
| **Actual outcome**   |                                                                                                                             |

### T68 — Edit task name inline

|                      |                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Clicking Edit on a task opens an inline form; saving updates the task name.                                                  |
| **Preconditions**    | At least one active task exists.                                                                                             |
| **Steps**            | 1. Click "Edit" on a task. 2. Change the name. 3. Click Save (or press Ctrl+Enter).                                         |
| **Expected outcome** | The form closes. The task row shows the new name. Firestore is updated.                                                      |
| **Actual outcome**   |                                                                                                                              |

### T69 — Edit task project (move to different project)

|                      |                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Changing a task's project in the edit form moves it to the new project's group.                                              |
| **Preconditions**    | At least two projects exist. At least one task exists.                                                                       |
| **Steps**            | 1. Click "Edit" on a task. 2. Change the project select to a different project. 3. Save.                                    |
| **Expected outcome** | The task disappears from its original project group and appears under the new project group.                                  |
| **Actual outcome**   |                                                                                                                              |

### T70 — Edit task tags inline

|                      |                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Editing tags updates the task's tag list.                                                                                    |
| **Preconditions**    | A task exists.                                                                                                               |
| **Steps**            | 1. Click "Edit" on a task. 2. Change the tags field to "billable, client". 3. Save.                                         |
| **Expected outcome** | The task row shows "#billable #client" tags. Firestore shows `tags: ["billable", "client"]`.                                 |
| **Actual outcome**   |                                                                                                                              |

### T71 — Complete a task via checkbox on Edit Tasks page

|                      |                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | Checking the checkbox on an active task marks it as completed.                                                                                    |
| **Preconditions**    | At least one active task exists.                                                                                                                  |
| **Steps**            | 1. Check the checkbox on an active task.                                                                                                          |
| **Expected outcome** | The task name gets a strikethrough. The Archive and Delete buttons remain visible. Firestore shows `status: "completed"` with a `completedAt` timestamp. |
| **Actual outcome**   |                                                                                                                                |

### T72 — Uncomplete a task via checkbox

|                      |                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Unchecking a completed task restores it to active.                                                               |
| **Preconditions**    | At least one completed task exists.                                                                              |
| **Steps**            | 1. Uncheck the checkbox on a completed task.                                                                     |
| **Expected outcome** | Strikethrough is removed. Archive button disappears. Firestore shows `status: "active"` and `completedAt: null`. |
| **Actual outcome**   |                                                                                                                  |

### T73 — Archive a task (active or completed)

|                      |                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Clicking Archive on any non-archived task archives it (completing it first if active).                                                                                                         |
| **Preconditions**    | At least one active task and one completed task exist.                                                                                                                                         |
| **Steps**            | 1. Click "Archive" on an active task. 2. Click "Archive" on a completed task.                                                                                                                  |
| **Expected outcome** | Both tasks disappear from the default view. The previously active task has `completedAt` set. Both show "archived" label when "Show archived" is toggled on. Firestore shows `status: "archived"`. |
| **Actual outcome**   |                                                                                                                                                                                                |

### T74 — Cannot archive or complete a running task

|                      |                                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Attempting to complete or archive a running task shows an error.                                                                                      |
| **Preconditions**    | A task is currently running in the timer popup.                                                                                                       |
| **Steps**            | 1. On the Edit Tasks page, try to check the checkbox of the running task. 2. Try to click "Archive" on the running task.                              |
| **Expected outcome** | An inline error appears: "Task is currently running. Stop the timer first." The task status does not change in either case.                           |
| **Actual outcome**   |                                                                                                                                                       |

### T75 — Un-archive a task

|                      |                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Clicking "Un-archive" on an archived task restores it to active.                                                       |
| **Preconditions**    | At least one archived task exists. "Show archived" toggle is on.                                                       |
| **Steps**            | 1. Click "Un-archive" on an archived task.                                                                             |
| **Expected outcome** | The task becomes active and appears in the default view (without archived toggle). Firestore shows `status: "active"`. |
| **Actual outcome**   |                                                                                                                        |

### T76 — Delete task with time entry count confirmation

|                      |                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Deleting a task shows the count of time entries that will also be deleted.                                                                                          |
| **Preconditions**    | A task exists with at least one time entry.                                                                                                                         |
| **Steps**            | 1. Click "Delete" on a task. 2. Read the confirmation message. 3. Click "Yes, delete".                                                                              |
| **Expected outcome** | Confirmation shows: "Delete [task name]? This will also delete X time entries." After confirming, the task and all its time entries are deleted from Firestore. |
| **Actual outcome**   |                                                                                                                                                                     |

## Edit Projects

### T77 — Projects page shows all projects

|                      |                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | The Edit Projects page lists all projects with color, name, task counts by status, and actions.                                                                                              |
| **Preconditions**    | User is logged in with at least one project containing tasks in various states.                                                                                                              |
| **Steps**            | 1. Navigate to `/projects`.                                                                                                                                                                  |
| **Expected outcome** | Each project shows a color swatch, name, task counts (active/completed/archived — "0 tasks" if empty), tags, and buttons: Edit · Complete all · Archive all · Delete. Rows use the light-blue entry card style. |
| **Actual outcome**   |                                                                                                                                      |

### T78 — Edit project name and color inline

|                      |                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Clicking Edit opens an inline form with color picker and name field.                                                 |
| **Preconditions**    | At least one project exists.                                                                                         |
| **Steps**            | 1. Click "Edit" on a project. 2. Change the name and color. 3. Click Save (or press Ctrl+Enter).                    |
| **Expected outcome** | The form closes. The project row shows the new name and updated color swatch. Firestore is updated.                  |
| **Actual outcome**   |                                                                                                                      |

### T79 — Edit project tags inline

|                      |                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Editing project tags updates the tag list.                                                                           |
| **Preconditions**    | A project exists.                                                                                                    |
| **Steps**            | 1. Click "Edit" on a project. 2. Enter "billable, internal" in the tags field. 3. Save.                             |
| **Expected outcome** | The project row shows "#billable #internal". Firestore shows `tags: ["billable", "internal"]`.                       |
| **Actual outcome**   |                                                                                                                      |

### T80 — Complete all tasks in a project

|                      |                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | "Complete all" marks all active tasks in the project as completed. The button is disabled when no active tasks exist.                         |
| **Preconditions**    | A project has at least two active tasks. No task is currently running.                                                                       |
| **Steps**            | 1. Verify "Complete all" is disabled on a project with 0 active tasks. 2. Click "Complete all" on a project with active tasks. 3. Read the confirmation. 4. Click "Yes, complete all". |
| **Expected outcome** | All active tasks are set to `completed`. The active count drops to 0 and the completed count increases. Tasks appear with strikethrough in Edit Tasks. |
| **Actual outcome**   |                                                                                                                                    |

### T81 — Archive all tasks in a project

|                      |                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | "Archive all" archives all non-archived (active + completed) tasks. Disabled only when all tasks are already archived (or none exist). |
| **Preconditions**    | A project has at least two tasks in mixed states (active, completed). No task is currently running.                                   |
| **Steps**            | 1. Verify "Archive all" is disabled on a project with 0 active and 0 completed tasks. 2. Verify "Archive all" is enabled on a project with only completed tasks. 3. Click "Archive all". 4. Read the confirmation — it says "active and completed tasks". 5. Click "Yes, archive all". |
| **Expected outcome** | All non-archived tasks are archived. The project no longer appears in the timer task list. Active and completed counts drop to 0; archived count increases. |
| **Actual outcome**   |                                                                                                                                         |

### T82 — Cannot complete/archive-all if a task is running

|                      |                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | "Complete all" and "Archive all" are blocked if any task in the project is currently running.                                |
| **Preconditions**    | A task in the project is currently running in the timer popup.                                                               |
| **Steps**            | 1. Click "Complete all" on the project containing the running task.                                                          |
| **Expected outcome** | An inline error appears: "[task name] is currently running. Stop the timer first." No tasks are modified.                    |
| **Actual outcome**   |                                                                                                                              |

### T83 — Delete project: type-to-confirm, shows impact count

|                      |                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | Clicking Delete on a project shows the count of tasks and time entries that will be deleted, with a type-to-confirm input.                    |
| **Preconditions**    | A project exists with at least one task and one time entry.                                                                                  |
| **Steps**            | 1. Click "Delete" on a project.                                                                                                              |
| **Expected outcome** | Inline form shows: "Delete [name]? This will permanently delete X tasks and Y time entries." A text input is shown with placeholder = project name. |
| **Actual outcome**   |                                                                                                                                              |

### T84 — Delete project: button disabled until name matches

|                      |                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Scenario**         | The Delete button is disabled until the user types the exact project name.                                                      |
| **Preconditions**    | The delete confirmation is open for a project named "My Project".                                                               |
| **Steps**            | 1. Type "my project" (wrong case). 2. Type "My Project" (exact match). 3. Click "Delete project".                              |
| **Expected outcome** | The button remains disabled for wrong/partial input. It enables only when input matches exactly. After confirming, the project, all its tasks, and all time entries are deleted. |
| **Actual outcome**   |                                                                                                                                 |

### T85 — Edit project: auto-save when switching to another project's edit form

|                      |                                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | Clicking Edit on a second project while the first is being edited auto-saves any changes to the first.                                                                                    |
| **Preconditions**    | At least two projects exist.                                                                                                                                                               |
| **Steps**            | 1. Click "Edit" on project A. 2. Change the name to something new. 3. Click "Edit" on project B (without saving A first).                                                                 |
| **Expected outcome** | Project A's edit form closes and its new name is saved (Firestore updated). Project B's edit form opens immediately. No explicit Save click was needed for project A.                      |
| **Actual outcome**   |                                                                                                                                                                                            |

### T86 — Edit project: no Firestore write when nothing changed

|                      |                                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Scenario**         | Clicking Save (or switching away) without making any changes does not write to Firestore.                                                                                                  |
| **Preconditions**    | At least one project exists. Firestore network tab is open in browser DevTools.                                                                                                            |
| **Steps**            | 1. Click "Edit" on a project. 2. Do not change anything. 3. Click Save (or Ctrl+Enter).                                                                                                   |
| **Expected outcome** | The form closes. No Firestore write request is made. The project's `updatedAt` timestamp is unchanged.                                                                                     |
| **Actual outcome**   |                                                                                                                                                                                            |
