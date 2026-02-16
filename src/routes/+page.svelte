<script lang="ts">
	import { getUser } from '$lib/firebase/auth.svelte';
	import { useCollection, useQuery } from '$lib/firebase/firestore.svelte';
	import { getTimer } from '$lib/stores/timer.svelte';
	import { formatDuration, todayDateString } from '$lib/utils/format';
	import { query, where, collection } from 'firebase/firestore';
	import { db } from '$lib/firebase/config';
	import type { Project, Task, TimeEntry } from '$lib/firebase/types';

	import TimerDisplay from '$lib/components/TimerDisplay.svelte';
	import TaskList from '$lib/components/TaskList.svelte';
	import AddProjectForm from '$lib/components/AddProjectForm.svelte';
	import AddTaskForm from '$lib/components/AddTaskForm.svelte';
	import CommentField from '$lib/components/CommentField.svelte';

	const user = getUser();
	const timer = getTimer();

	const uid = $derived(user.current?.uid ?? '');

	// Initialize timer (recover from page reload)
	$effect(() => {
		if (uid) timer.initTimer(uid);
	});

	// Load data from Firestore (guarded — uid is '' until auth resolves)
	const projects = $derived(uid ? useCollection<Project>(`users/${uid}/projects`) : { data: [] as Project[], loading: true });
	const tasks = $derived(uid ? useCollection<Task>(`users/${uid}/tasks`) : { data: [] as Task[], loading: true });
	const todayQuery = $derived(
		uid ? query(collection(db, `users/${uid}/timeEntries`), where('date', '==', todayDateString())) : null
	);
	const todayEntries = $derived(todayQuery ? useQuery<TimeEntry>(todayQuery) : { data: [] as TimeEntry[], loading: true });

	// Group active + today-completed tasks by project
	const today = todayDateString();
	const visibleTasks = $derived(
		tasks.data.filter((t) => {
			if (t.status === 'active') return true;
			if (t.status === 'completed') {
				// Show completed tasks until midnight — hide once completedAt is a past day
				if (!t.completedAt) return true;
				const completedDate = t.completedAt.toDate().toISOString().slice(0, 10);
				return completedDate === today;
			}
			return false; // archived
		})
	);
	const tasksByProject = $derived(
		projects.data
			.slice()
			.sort((a, b) => a.order - b.order)
			.map((p) => ({
				project: p,
				tasks: visibleTasks
					.filter((t) => t.projectId === p.id)
					.sort((a, b) => a.order - b.order)
			}))
			.filter((g) => g.tasks.length > 0)
	);

	// Compute total duration per task from today's completed entries
	const taskDurations = $derived(() => {
		const durations: Record<string, number> = {};
		for (const entry of todayEntries.data) {
			if (entry.endTime !== null) {
				durations[entry.taskId] = (durations[entry.taskId] || 0) + entry.duration;
			}
		}
		return durations;
	});

	// Daily total: completed entries + running timer
	const completedSeconds = $derived(
		todayEntries.data
			.filter((e) => e.endTime !== null)
			.reduce((sum, e) => sum + e.duration, 0)
	);
	const dailyTotal = $derived(completedSeconds + (timer.isRunning ? timer.elapsed : 0));

	// Play button is enabled when running OR when there's an active task that is still active (not completed/archived)
	const canResume = $derived(
		timer.isRunning ||
		(timer.activeTaskId !== null &&
			tasks.data.some((t) => t.id === timer.activeTaskId && t.status === 'active'))
	);

	// Window title: "[HH:MM:SS] Task Name - SlickTimer" while running, else "SlickTimer"
	const windowTitle = $derived(
		timer.isRunning && timer.activeTaskName
			? `[${formatDuration(timer.elapsed)}] ${timer.activeTaskName} - SlickTimer`
			: 'SlickTimer'
	);

	function handleTaskClick(taskId: string, task: Task) {
		timer.startTask(taskId, task);
	}

	// Which form/field is open: 'task' | 'project' | 'comment' | null
	let openForm = $state<'task' | 'project' | 'comment' | null>(null);

	function handleKeydown(e: KeyboardEvent) {
		// ESC closes whichever form is open
		if (e.key === 'Escape') {
			openForm = null;
			return;
		}

		// Letter shortcuts only fire when no input/select/textarea is focused
		const tag = (e.target as HTMLElement)?.tagName;
		if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
		if (e.metaKey || e.ctrlKey || e.altKey) return;

		if (e.key === 't' || e.key === 'T') {
			e.preventDefault();
			openForm = 'task';
		} else if (e.key === 'p' || e.key === 'P') {
			e.preventDefault();
			openForm = 'project';
		} else if ((e.key === 'c' || e.key === 'C') && timer.activeTaskId) {
			e.preventDefault();
			openForm = 'comment';
		}
	}
</script>

<svelte:head>
	<title>{windowTitle}</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<TimerDisplay
	totalSeconds={dailyTotal}
	isRunning={timer.isRunning}
	{canResume}
	pomodoroActive={timer.pomodoroActive}
	pomodoroRemaining={timer.pomodoroRemaining}
	pomodoroTargetSeconds={timer.pomodoroTargetSeconds}
	onPlayPause={() => (timer.isRunning ? timer.stopTimer() : timer.resumeTask())}
	onTogglePomodoro={() => timer.togglePomodoro()}
/>

<div class="min-h-0 flex-1 overflow-y-auto">
	<TaskList
		{tasksByProject}
		runningTaskId={timer.runningTaskId}
		activeTaskId={timer.activeTaskId}
		taskDurations={taskDurations()}
		runningElapsed={timer.elapsed}
		onTaskClick={handleTaskClick}
		onCompleteTask={(id) => timer.completeTask(id)}
		onUncompleteTask={(id) => timer.uncompleteTask(id)}
		onArchiveTask={(id) => timer.archiveTask(id)}
		onReorderTasks={(ids) => timer.reorderTasks(ids)}
		onReorderProjects={(ids) => timer.reorderProjects(ids)}
	/>
</div>

<div class="shrink-0 border-t border-border">
	<CommentField
		comment={timer.comment}
		isRunning={timer.isRunning}
		open={openForm === 'comment'}
		onOpen={() => (openForm = 'comment')}
		onClose={() => (openForm = null)}
		onSave={(text) => timer.saveComment(text)}
	/>
	<AddTaskForm
		{uid}
		projects={projects.data}
		tasks={tasks.data}
		taskCount={tasks.data.length}
		open={openForm === 'task'}
		onOpen={() => (openForm = 'task')}
		onClose={() => (openForm = null)}
		onStartTask={(taskId, task) => timer.startTask(taskId, task)}
	/>
	<AddProjectForm
		{uid}
		projects={projects.data}
		projectCount={projects.data.length}
		open={openForm === 'project'}
		onOpen={() => (openForm = 'project')}
		onClose={() => (openForm = null)}
	/>
</div>
