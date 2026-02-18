<script lang="ts">
	import { getUser } from '$lib/firebase/auth.svelte';
	import { useCollection, useQuery } from '$lib/firebase/firestore.svelte';
	import { db } from '$lib/firebase/config';
	import { query, where, collection, doc, updateDoc, deleteDoc, addDoc, Timestamp, orderBy } from 'firebase/firestore';
	import { formatDurationShort, todayDateString } from '$lib/utils/format';
	import type { Project, Task, TimeEntry } from '$lib/firebase/types';

	const user = getUser();
	const uid = $derived(user.current?.uid ?? '');

	// Selected date (defaults to today)
	let selectedDate = $state(todayDateString());

	function prevDay() {
		const d = new Date(selectedDate + 'T12:00:00');
		d.setDate(d.getDate() - 1);
		selectedDate = d.toISOString().slice(0, 10);
	}

	function nextDay() {
		const d = new Date(selectedDate + 'T12:00:00');
		d.setDate(d.getDate() + 1);
		selectedDate = d.toISOString().slice(0, 10);
	}

	function formatDisplayDate(dateStr: string): string {
		const today = todayDateString();
		const yesterday = (() => { const d = new Date(today + 'T12:00:00'); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();
		const tomorrow = (() => { const d = new Date(today + 'T12:00:00'); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })();

		const d = new Date(dateStr + 'T12:00:00');
		const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });

		if (dateStr === today) return `Today · ${weekday}`;
		if (dateStr === yesterday) return `Yesterday · ${weekday}`;
		if (dateStr === tomorrow) return `Tomorrow · ${weekday}`;
		return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
	}

	function formatTimeHHMM(ts: Timestamp): string {
		const d = ts.toDate();
		const h = String(d.getHours()).padStart(2, '0');
		const m = String(d.getMinutes()).padStart(2, '0');
		return `${h}:${m}`;
	}

	/** Parse HH:MM string into a Date for the selected day with specified seconds */
	function parseTimeToDate(timeStr: string, seconds: number = 0): Date | null {
		const parts = timeStr.split(':');
		if (parts.length < 2) return null;
		const h = parseInt(parts[0], 10);
		const m = parseInt(parts[1], 10);
		if (isNaN(h) || isNaN(m)) return null;
		if (h < 0 || h > 23 || m < 0 || m > 59) return null;
		const d = new Date(`${selectedDate}T00:00:00`);
		d.setHours(h, m, seconds, 0);
		return d;
	}

	// Load projects and tasks for name lookups
	const projects = useCollection<Project>(() => uid ? `users/${uid}/projects` : null);
	const tasks = useCollection<Task>(() => uid ? `users/${uid}/tasks` : null);

	// Query entries for selected date
	const entries = useQuery<TimeEntry>(() =>
		uid ? query(collection(db, `users/${uid}/timeEntries`), where('date', '==', selectedDate), orderBy('startTime', 'asc')) : null
	);

	// Lookup maps
	const projectMap = $derived(
		Object.fromEntries(projects.data.map((p) => [p.id, p]))
	);
	const taskMap = $derived(
		Object.fromEntries(tasks.data.map((t) => [t.id, t]))
	);

	// Daily total and entry count (completed entries only)
	const completedEntries = $derived(
		entries.data.filter((e) => e.endTime !== null)
	);
	const dailyTotal = $derived(
		completedEntries.reduce((sum, e) => sum + e.duration, 0)
	);

	// Edit state
	let editingId = $state<string | null>(null);
	let editStart = $state('');
	let editEnd = $state('');
	let editComment = $state('');
	let editError = $state('');
	// Track original values to detect changes
	let editOrigStart = $state('');
	let editOrigEnd = $state('');
	// Original seconds from the entry being edited
	let editOrigStartSec = $state(0);
	let editOrigEndSec = $state(0);

	function startEdit(entry: TimeEntry) {
		editingId = entry.id;
		editStart = formatTimeHHMM(entry.startTime);
		editEnd = entry.endTime ? formatTimeHHMM(entry.endTime) : '';
		editComment = entry.comment || '';
		editError = '';
		editOrigStart = editStart;
		editOrigEnd = editEnd;
		editOrigStartSec = entry.startTime.toDate().getSeconds();
		editOrigEndSec = entry.endTime ? entry.endTime.toDate().getSeconds() : 0;
	}

	function cancelEdit() {
		editingId = null;
		editError = '';
	}

	async function saveEdit(entry: TimeEntry) {
		if (!uid) return;
		editError = '';

		// Determine seconds: if user changed the time, use :00/:59; otherwise preserve original
		const startSec = editStart !== editOrigStart ? 0 : editOrigStartSec;
		const endSec = editEnd !== editOrigEnd ? 59 : editOrigEndSec;

		const startDate = parseTimeToDate(editStart, startSec);
		if (!startDate) {
			editError = 'Invalid start time.';
			return;
		}

		const endDate = editEnd ? parseTimeToDate(editEnd, endSec) : null;
		if (editEnd && !endDate) {
			editError = 'Invalid end time.';
			return;
		}

		const duration = endDate ? Math.floor((endDate.getTime() - startDate.getTime()) / 1000) : 0;

		if (endDate && duration < 10) {
			editError = 'Duration must be at least 10 seconds.';
			return;
		}

		const ref = doc(db, `users/${uid}/timeEntries`, entry.id);
		await updateDoc(ref, {
			startTime: Timestamp.fromDate(startDate),
			endTime: endDate ? Timestamp.fromDate(endDate) : null,
			duration,
			comment: editComment,
			updatedAt: Timestamp.now()
		});
		editingId = null;
	}

	// Delete state
	let deletingId = $state<string | null>(null);

	async function confirmDelete(entryId: string) {
		if (!uid) return;
		await deleteDoc(doc(db, `users/${uid}/timeEntries`, entryId));
		deletingId = null;
	}

	// New entry state
	let showNewForm = $state(false);
	let newTaskId = $state('');
	let newStart = $state('');
	let newEnd = $state('');
	let newComment = $state('');
	let newError = $state('');

	function cancelNewEntry() {
		showNewForm = false;
		newError = '';
	}

	async function saveNewEntry() {
		if (!uid) return;
		newError = '';

		if (!newTaskId) {
			newError = 'Please select a task.';
			return;
		}
		if (!newStart || !newEnd) {
			newError = 'Please enter start and end times.';
			return;
		}

		const task = taskMap[newTaskId];
		if (!task) {
			newError = 'Selected task not found.';
			return;
		}

		// New entries: start at :00 seconds, end at :59 seconds
		const startDate = parseTimeToDate(newStart, 0);
		if (!startDate) {
			newError = 'Invalid start time.';
			return;
		}

		const endDate = parseTimeToDate(newEnd, 59);
		if (!endDate) {
			newError = 'Invalid end time.';
			return;
		}

		const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
		if (duration < 10) {
			newError = 'Duration must be at least 10 seconds.';
			return;
		}

		await addDoc(collection(db, `users/${uid}/timeEntries`), {
			taskId: newTaskId,
			projectId: task.projectId,
			startTime: Timestamp.fromDate(startDate),
			endTime: Timestamp.fromDate(endDate),
			duration,
			tags: task.tags || [],
			comment: newComment,
			date: selectedDate,
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now(),
			userId: uid
		});

		showNewForm = false;
		newTaskId = '';
		newStart = '';
		newEnd = '';
		newComment = '';
		newError = '';
	}

	// Active tasks for the new entry form
	const activeTasks = $derived(
		tasks.data.filter((t) => t.status === 'active')
	);

	// The entry currently being edited (for keyboard save)
	const editingEntry = $derived(
		editingId ? entries.data.find((e) => e.id === editingId) ?? null : null
	);

	/** Try to save whichever form is open. Returns true if saved (or nothing open). */
	async function trySaveOpenForm(): Promise<boolean> {
		if (showNewForm) {
			await saveNewEntry();
			return !showNewForm; // saveNewEntry sets showNewForm=false on success
		}
		if (editingEntry) {
			await saveEdit(editingEntry);
			return editingId === null; // saveEdit sets editingId=null on success
		}
		return true;
	}

	async function prevDayWithSave() {
		if (!(await trySaveOpenForm())) return;
		prevDay();
	}

	async function nextDayWithSave() {
		if (!(await trySaveOpenForm())) return;
		nextDay();
	}

	function handleKeydown(e: KeyboardEvent) {
		// Ctrl+Enter / Cmd+Enter: save open form
		if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			if (showNewForm) saveNewEntry();
			else if (editingEntry) saveEdit(editingEntry);
		}
		// Escape: dismiss delete confirmation, or cancel open form
		if (e.key === 'Escape') {
			if (deletingId !== null) {
				e.preventDefault();
				deletingId = null;
			} else if (showNewForm) {
				e.preventDefault();
				cancelNewEntry();
			} else if (editingId !== null) {
				e.preventDefault();
				cancelEdit();
			}
		}
	}
</script>

<svelte:head>
	<title>SlickTimer — Edit Entries</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="flex h-full flex-col overflow-hidden px-2 py-2">
	<!-- Header row -->
	<div class="flex items-center justify-between pb-2">
		<!-- Left: New Entry link -->
		<div class="w-28">
			{#if !showNewForm}
				<button
					onclick={() => { showNewForm = true; newError = ''; }}
					class="text-sm text-primary hover:underline"
				>
					+ New Entry
				</button>
			{/if}
		</div>

		<!-- Center: Date navigation -->
		<div class="flex items-center gap-1">
			<button onclick={prevDayWithSave} class="text-sm text-text-secondary hover:text-text-primary">&larr;</button>
			<span class="text-sm font-semibold text-text-primary">{formatDisplayDate(selectedDate)}</span>
			<button onclick={nextDayWithSave} class="text-sm text-text-secondary hover:text-text-primary">&rarr;</button>
		</div>

		<!-- Right: Entry count and total -->
		<div class="w-28 text-right">
			{#if entries.data.length > 0}
				<span class="whitespace-nowrap text-xs text-text-secondary">
					<strong>{entries.data.length}</strong> {entries.data.length === 1 ? 'entry' : 'entries'}
					<strong>{formatDurationShort(dailyTotal)}</strong>
				</span>
			{/if}
		</div>
	</div>

	<!-- New entry form -->
	{#if showNewForm}
		<div class="mb-2 border border-border bg-bg-edit p-2">
			<div class="space-y-1">
				<select bind:value={newTaskId} class="w-full border border-border px-1 py-0.5 text-sm">
					<option value="">Select task...</option>
					{#each activeTasks as task}
						<option value={task.id}>{task.name} ({projectMap[task.projectId]?.name ?? ''})</option>
					{/each}
				</select>
				<div class="flex items-center gap-2">
					<input
						type="time"
						bind:value={newStart}
						class="border border-border px-1 py-0.5 text-sm font-mono"
					/>
					<span class="text-sm text-text-secondary">to</span>
					<input
						type="time"
						bind:value={newEnd}
						class="border border-border px-1 py-0.5 text-sm font-mono"
					/>
				</div>
				<input
					type="text"
					bind:value={newComment}
					placeholder="Comment (optional)"
					class="w-full border border-border px-1 py-0.5 text-sm"
				/>
				{#if newError}
					<p class="text-xs text-timer-stopped">{newError}</p>
				{/if}
				<div class="flex gap-2">
					<button
						onclick={saveNewEntry}
						class="bg-primary px-2 py-0.5 text-sm text-white hover:bg-primary/90"
					>
						Save
					</button>
					<button onclick={cancelNewEntry} class="text-sm text-text-secondary hover:text-text-primary">
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Entries list -->
	<div class="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
		{#if entries.loading}
			<p class="text-sm text-text-secondary">Loading...</p>
		{:else if entries.data.length === 0}
			<p class="text-sm text-text-secondary">No entries for this day.</p>
		{:else}
			{#each entries.data as entry}
				<div class="rounded bg-bg-entry border border-border-entry p-2">
					{#if editingId === entry.id}
						<!-- Edit mode -->
						<div class="space-y-1">
							<div class="flex items-center gap-2">
								<input
									type="time"
									bind:value={editStart}
									class="border border-border px-1 py-0.5 text-sm font-mono"
								/>
								<span class="text-sm text-text-secondary">to</span>
								<input
									type="time"
									bind:value={editEnd}
									class="border border-border px-1 py-0.5 text-sm font-mono"
								/>
							</div>
							<input
								type="text"
								bind:value={editComment}
								placeholder="Comment"
								class="w-full border border-border px-1 py-0.5 text-sm"
							/>
							{#if editError}
								<p class="text-xs text-timer-stopped">{editError}</p>
							{/if}
							<div class="flex gap-2">
								<button onclick={() => saveEdit(entry)} class="bg-primary px-2 py-0.5 text-sm text-white">Save</button>
								<button onclick={cancelEdit} class="text-sm text-text-secondary hover:text-text-primary">Cancel</button>
							</div>
						</div>
					{:else if deletingId === entry.id}
						<!-- Delete confirmation -->
						<div class="flex items-center gap-2">
							<span class="text-sm text-text-primary">Delete this entry?</span>
							<button onclick={() => confirmDelete(entry.id)} class="text-sm text-timer-stopped hover:underline">Yes</button>
							<button onclick={() => (deletingId = null)} class="text-sm text-text-secondary hover:text-text-primary">No</button>
						</div>
					{:else}
						<!-- Display mode: [time/dur] [info] [actions] -->
						<div class="grid items-start gap-x-3" style="grid-template-columns: 8rem 1fr auto">
							<div class="text-left">
								<div class="text-sm font-mono text-text-primary">
									{#if entry.endTime}
										{formatTimeHHMM(entry.startTime)}<span class="text-text-secondary"> – </span>{formatTimeHHMM(entry.endTime)}
									{:else}
										{formatTimeHHMM(entry.startTime)}<span class="font-sans text-xs text-timer-active"> (running)</span>
									{/if}
								</div>
								{#if entry.endTime}
									<div class="text-xs text-text-secondary">{formatDurationShort(entry.duration)}</div>
								{/if}
							</div>
							<div class="min-w-0">
								<div class="flex items-center gap-1 text-sm">
									{#if projectMap[entry.projectId]?.color}
										<span
											class="inline-block h-2 w-2 shrink-0 rounded-sm"
											style="background-color: {projectMap[entry.projectId].color}"
										></span>
									{/if}
									<span class="text-text-secondary">{projectMap[entry.projectId]?.name ?? 'Unknown project'}</span>
									<span class="text-text-secondary"> · </span>
									<span class="font-semibold text-text-primary">{taskMap[entry.taskId]?.name ?? 'Unknown task'}</span>
								</div>
								{#if (entry.tags ?? []).length || (taskMap[entry.taskId]?.tags ?? []).length || (projectMap[entry.projectId]?.tags ?? []).length}
									{@const entryTags = entry.tags ?? []}
									{@const taskTags = taskMap[entry.taskId]?.tags ?? []}
									{@const projectTags = projectMap[entry.projectId]?.tags ?? []}
									<div class="text-xs text-text-secondary">
										{#if entryTags.length > 0}
											{entryTags.map((t) => `#${t}`).join(' ')}
										{/if}
										{#if taskTags.length > 0}
											{#if entryTags.length > 0}<span> · </span>{/if}
											<span>From Task: {taskTags.map((t) => `#${t}`).join(' ')}</span>
										{/if}
										{#if projectTags.length > 0}
											{#if entryTags.length > 0 || taskTags.length > 0}<span> · </span>{/if}
											<span>From Project: {projectTags.map((t) => `#${t}`).join(' ')}</span>
										{/if}
									</div>
								{:else}
									<div class="text-xs text-text-secondary">No tags</div>
								{/if}
								{#if entry.comment}
									<div class="text-xs text-text-secondary italic">"{entry.comment}"</div>
								{/if}
							</div>
							<div class="flex items-center gap-1.5">
								<button onclick={() => startEdit(entry)} class="text-xs text-text-secondary hover:text-primary">Edit</button>
								<span class="text-xs text-text-secondary">·</span>
								<button onclick={() => (deletingId = entry.id)} class="text-xs text-text-secondary hover:text-timer-stopped">Delete</button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
