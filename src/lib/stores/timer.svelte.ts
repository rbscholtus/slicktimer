import {
	collection,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	query,
	where,
	limit,
	orderBy,
	serverTimestamp
} from 'firebase/firestore';
import { db } from '$lib/firebase/config';
import { todayDateString } from '$lib/utils/format';
import type { Task } from '$lib/firebase/types';

const MIN_DURATION_SECONDS = 10;
const POMODORO_DEFAULT_SECONDS = 25 * 60;
const IDLE_THRESHOLD_MS = 15 * 60 * 1000;

// Core timer state
let uid = $state<string | null>(null);
let runningTaskId = $state<string | null>(null);
let runningEntryId = $state<string | null>(null);
let startTimestamp = $state<number | null>(null);
let elapsed = $state(0);
let intervalId = $state<ReturnType<typeof setInterval> | null>(null);

// Active task: the task whose duration is shown (persists after stop until a new task starts)
let activeTaskId = $state<string | null>(null);
let activeTaskName = $state<string | null>(null);
let activeTask = $state<Task | null>(null);

// Comment for the current (or last) time entry
let comment = $state('');

// Pomodoro state
let pomodoroActive = $state(false);
let pomodoroTargetSeconds = $state(POMODORO_DEFAULT_SECONDS);
let pomodoroNotified = $state(false);

// Idle notification state
let idleTimeoutId = $state<ReturnType<typeof setTimeout> | null>(null);

function startInterval() {
	stopInterval();
	intervalId = setInterval(() => {
		if (startTimestamp !== null) {
			elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
		}

		// Pomodoro notification
		if (pomodoroActive && !pomodoroNotified && elapsed >= pomodoroTargetSeconds) {
			pomodoroNotified = true;
			if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
				new Notification('SlickTimer', { body: 'Pomodoro complete!' });
			}
		}
	}, 1000);
}

function stopInterval() {
	if (intervalId !== null) {
		clearInterval(intervalId);
		intervalId = null;
	}
}

function startIdleTimeout() {
	clearIdleTimeout();
	idleTimeoutId = setTimeout(() => {
		if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
			new Notification('SlickTimer', {
				body: "You haven't been timing for 15 minutes."
			});
		}
	}, IDLE_THRESHOLD_MS);
}

function clearIdleTimeout() {
	if (idleTimeoutId !== null) {
		clearTimeout(idleTimeoutId);
		idleTimeoutId = null;
	}
}

async function startTask(taskId: string, task: Task) {
	if (!uid) return;

	// Toggle: clicking the running task stops it
	if (runningTaskId === taskId) {
		const snapshot = stopTimerOptimistic();
		if (snapshot.entryId) stopTimerFirestore(snapshot.entryId, snapshot.finalElapsed);
		return;
	}

	// Stop current timer if running a different task
	if (runningTaskId !== null) {
		const snapshot = stopTimerOptimistic();
		if (snapshot.entryId) stopTimerFirestore(snapshot.entryId, snapshot.finalElapsed);
	}

	clearIdleTimeout();

	// Update local state immediately — UI responds before any network round-trip
	const now = Date.now();
	runningTaskId = taskId;
	activeTaskId = taskId;
	activeTaskName = task.name;
	activeTask = task;
	runningEntryId = null; // will be filled once addDoc resolves
	startTimestamp = now;
	elapsed = 0;
	comment = '';
	pomodoroNotified = false;

	startInterval();

	// Write to Firestore in the background
	const localUid = uid;
	const date = todayDateString();

	const entryRef = await addDoc(collection(db, `users/${localUid}/timeEntries`), {
		taskId,
		projectId: task.projectId,
		startTime: serverTimestamp(),
		endTime: null,
		duration: 0,
		tags: task.tags || [],
		comment: '',
		date,
		userId: localUid,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	});

	// If the timer was stopped before addDoc resolved, delete the orphaned entry immediately
	if (runningTaskId !== taskId) {
		await deleteDoc(doc(db, `users/${localUid}/timeEntries/${entryRef.id}`));
		return;
	}

	runningEntryId = entryRef.id;

	// Fetch carry-over comment asynchronously and patch if still relevant
	try {
		const prevQ = query(
			collection(db, `users/${localUid}/timeEntries`),
			where('taskId', '==', taskId),
			where('date', '==', date),
			where('endTime', '!=', null),
			orderBy('endTime', 'desc'),
			limit(1)
		);
		const prevSnap = await getDocs(prevQ);
		if (!prevSnap.empty && runningTaskId === taskId) {
			const carryComment = prevSnap.docs[0].data().comment || '';
			if (carryComment) {
				comment = carryComment;
				await updateDoc(doc(db, `users/${localUid}/timeEntries/${entryRef.id}`), {
					comment: carryComment,
					updatedAt: serverTimestamp()
				});
			}
		}
	} catch {
		// Non-critical — timer is already running
	}
}

// Snapshot local state for the Firestore write, then clear immediately
function stopTimerOptimistic(): { entryId: string | null; finalElapsed: number } {
	stopInterval();

	const finalElapsed =
		startTimestamp !== null ? Math.floor((Date.now() - startTimestamp) / 1000) : elapsed;

	const entryId = runningEntryId;

	runningTaskId = null;
	runningEntryId = null;
	startTimestamp = null;
	elapsed = 0;
	pomodoroActive = false;
	pomodoroNotified = false;
	// comment persists for read-only display until next task starts

	startIdleTimeout();

	return { entryId, finalElapsed };
}

// Persist the stopped entry to Firestore
async function stopTimerFirestore(entryId: string, finalElapsed: number): Promise<void> {
	if (!uid) return;
	const entryPath = `users/${uid}/timeEntries/${entryId}`;
	if (finalElapsed < MIN_DURATION_SECONDS) {
		await deleteDoc(doc(db, entryPath));
	} else {
		await updateDoc(doc(db, entryPath), {
			endTime: serverTimestamp(),
			duration: finalElapsed,
			updatedAt: serverTimestamp()
		});
	}
}

async function stopTimer() {
	if (!uid || !runningEntryId) return;
	const { entryId, finalElapsed } = stopTimerOptimistic();
	if (entryId) await stopTimerFirestore(entryId, finalElapsed);
}

async function completeTask(taskId: string) {
	if (!uid) return;
	// Stop the timer if this task is currently running
	if (runningTaskId === taskId) {
		await stopTimer();
	}
	await updateDoc(doc(db, `users/${uid}/tasks/${taskId}`), {
		status: 'completed',
		completedAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	});
}

async function uncompleteTask(taskId: string) {
	if (!uid) return;
	await updateDoc(doc(db, `users/${uid}/tasks/${taskId}`), {
		status: 'active',
		completedAt: null,
		updatedAt: serverTimestamp()
	});
}

async function archiveTask(taskId: string) {
	if (!uid) return;
	// If this task is running, stop it first
	if (runningTaskId === taskId) {
		await stopTimer();
	}
	await updateDoc(doc(db, `users/${uid}/tasks/${taskId}`), {
		status: 'archived',
		updatedAt: serverTimestamp()
	});
}

async function reorderTasks(taskIds: string[]) {
	if (!uid) return;
	await Promise.all(
		taskIds.map((id, index) =>
			updateDoc(doc(db, `users/${uid}/tasks/${id}`), { order: index, updatedAt: serverTimestamp() })
		)
	);
}

async function reorderProjects(projectIds: string[]) {
	if (!uid) return;
	await Promise.all(
		projectIds.map((id, index) =>
			updateDoc(doc(db, `users/${uid}/projects/${id}`), {
				order: index,
				updatedAt: serverTimestamp()
			})
		)
	);
}

async function saveComment(text: string) {
	if (!uid || !runningEntryId) return;
	comment = text;
	await updateDoc(doc(db, `users/${uid}/timeEntries/${runningEntryId}`), {
		comment: text,
		updatedAt: serverTimestamp()
	});
}

function togglePomodoro(durationMinutes: number = 25) {
	pomodoroActive = !pomodoroActive;
	pomodoroTargetSeconds = durationMinutes * 60;
	pomodoroNotified = false;
}

async function resumeTask() {
	if (!activeTaskId || !activeTask || runningTaskId !== null) return;
	await startTask(activeTaskId, activeTask);
}

async function initTimer(userUid: string) {
	uid = userUid;

	// Request notification permission early so alerts work without requiring a task start
	if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
		Notification.requestPermission();
	}

	// Recover running timer from Firestore (handles page reload)
	const q = query(
		collection(db, `users/${uid}/timeEntries`),
		where('endTime', '==', null),
		limit(1)
	);
	const snap = await getDocs(q);

	if (!snap.empty) {
		const entry = snap.docs[0];
		const data = entry.data();
		runningTaskId = data.taskId;
		activeTaskId = data.taskId;
		runningEntryId = entry.id;
		comment = data.comment || '';
		// Recover startTimestamp from Firestore timestamp
		if (data.startTime?.toMillis) {
			startTimestamp = data.startTime.toMillis();
			elapsed = Math.floor((Date.now() - startTimestamp!) / 1000);
		}
		// Recover task name for title bar
		try {
			const taskSnap = await getDoc(doc(db, `users/${uid}/tasks/${data.taskId}`));
			if (taskSnap.exists()) {
				const taskData = taskSnap.data();
				activeTaskName = taskData.name || null;
				activeTask = { id: data.taskId, ...taskData } as Task;
			}
		} catch {
			// Non-critical
		}
		startInterval();
	} else {
		// No running timer — start idle timeout
		startIdleTimeout();
	}
}

export function getTimer() {
	return {
		get runningTaskId() {
			return runningTaskId;
		},
		get activeTaskId() {
			return activeTaskId;
		},
		get elapsed() {
			return elapsed;
		},
		get isRunning() {
			return runningTaskId !== null;
		},
		get comment() {
			return comment;
		},
		get pomodoroActive() {
			return pomodoroActive;
		},
		get pomodoroRemaining() {
			return pomodoroTargetSeconds - elapsed;
		},
		get pomodoroTargetSeconds() {
			return pomodoroTargetSeconds;
		},
		get activeTaskName() {
			return activeTaskName;
		},
		startTask,
		stopTimer,
		resumeTask,
		saveComment,
		togglePomodoro,
		initTimer,
		completeTask,
		uncompleteTask,
		archiveTask,
		reorderTasks,
		reorderProjects
	};
}
