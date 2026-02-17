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
		const d = new Date(dateStr + 'T12:00:00');
		return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
	}

	function formatTime(ts: Timestamp): string {
		const d = ts.toDate();
		return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
	}

	// Load projects and tasks for name lookups
	const projects = $derived(uid ? useCollection<Project>(`users/${uid}/projects`) : { data: [] as Project[], loading: true });
	const tasks = $derived(uid ? useCollection<Task>(`users/${uid}/tasks`) : { data: [] as Task[], loading: true });

	// Query entries for selected date
	const entriesQuery = $derived(
		uid ? query(collection(db, `users/${uid}/timeEntries`), where('date', '==', selectedDate), orderBy('startTime', 'asc')) : null
	);
	const entries = $derived(entriesQuery ? useQuery<TimeEntry>(entriesQuery) : { data: [] as TimeEntry[], loading: true });

	// Lookup maps
	const projectMap = $derived(
		Object.fromEntries(projects.data.map((p) => [p.id, p]))
	);
	const taskMap = $derived(
		Object.fromEntries(tasks.data.map((t) => [t.id, t]))
	);

	// Daily total
	const dailyTotal = $derived(
		entries.data
			.filter((e) => e.endTime !== null)
			.reduce((sum, e) => sum + e.duration, 0)
	);

	// Edit state
	let editingId = $state<string | null>(null);
	let editStart = $state('');
	let editEnd = $state('');
	let editComment = $state('');

	function startEdit(entry: TimeEntry) {
		editingId = entry.id;
		editStart = formatTime(entry.startTime);
		editEnd = entry.endTime ? formatTime(entry.endTime) : '';
		editComment = entry.comment || '';
	}

	function cancelEdit() {
		editingId = null;
	}

	async function saveEdit(entry: TimeEntry) {
		if (!uid) return;
		const ref = doc(db, `users/${uid}/timeEntries`, entry.id);
		const startDate = new Date(`${selectedDate}T${editStart}:00`);
		const endDate = editEnd ? new Date(`${selectedDate}T${editEnd}:00`) : null;
		const duration = endDate ? Math.floor((endDate.getTime() - startDate.getTime()) / 1000) : 0;

		if (endDate && duration < 10) return; // enforce minimum

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

	async function saveNewEntry() {
		if (!uid || !newTaskId || !newStart || !newEnd) return;
		const task = taskMap[newTaskId];
		if (!task) return;

		const startDate = new Date(`${selectedDate}T${newStart}:00`);
		const endDate = new Date(`${selectedDate}T${newEnd}:00`);
		const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

		if (duration < 10) return; // enforce minimum

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
	}

	// Active tasks for the new entry form
	const activeTasks = $derived(
		tasks.data.filter((t) => t.status === 'active')
	);
</script>

<svelte:head>
	<title>SlickTimer — Entries</title>
</svelte:head>

<div class="flex h-full flex-col overflow-hidden px-2 py-2">
	<!-- Date picker header -->
	<div class="flex items-center justify-between pb-2">
		<button onclick={prevDay} class="text-sm text-text-secondary hover:text-text-primary">&larr;</button>
		<span class="text-sm font-semibold text-text-primary">{formatDisplayDate(selectedDate)}</span>
		<button onclick={nextDay} class="text-sm text-text-secondary hover:text-text-primary">&rarr;</button>
	</div>

	<!-- New entry button -->
	<div class="pb-2">
		<button
			onclick={() => (showNewForm = !showNewForm)}
			class="text-sm text-primary hover:underline"
		>
			{showNewForm ? 'Cancel' : '+ New Entry'}
		</button>
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
				<div class="flex gap-2">
					<input type="time" bind:value={newStart} class="border border-border px-1 py-0.5 text-sm" />
					<span class="text-sm text-text-secondary">to</span>
					<input type="time" bind:value={newEnd} class="border border-border px-1 py-0.5 text-sm" />
				</div>
				<input
					type="text"
					bind:value={newComment}
					placeholder="Comment (optional)"
					class="w-full border border-border px-1 py-0.5 text-sm"
				/>
				<button
					onclick={saveNewEntry}
					class="bg-primary px-2 py-0.5 text-sm text-white hover:bg-primary/90"
				>
					Save
				</button>
			</div>
		</div>
	{/if}

	<!-- Entries list -->
	<div class="min-h-0 flex-1 overflow-y-auto">
		{#if entries.loading}
			<p class="text-sm text-text-secondary">Loading...</p>
		{:else if entries.data.length === 0}
			<p class="text-sm text-text-secondary">No entries for this day.</p>
		{:else}
			{#each entries.data as entry, i}
				<div class="border-b border-border py-1.5 {i % 2 === 1 ? 'bg-bg-alt' : ''}">
					{#if editingId === entry.id}
						<!-- Edit mode -->
						<div class="bg-bg-edit p-1.5 space-y-1">
							<div class="flex gap-2 items-center">
								<input type="time" bind:value={editStart} class="border border-border px-1 py-0.5 text-sm" />
								<span class="text-sm text-text-secondary">to</span>
								<input type="time" bind:value={editEnd} class="border border-border px-1 py-0.5 text-sm" />
							</div>
							<input
								type="text"
								bind:value={editComment}
								placeholder="Comment"
								class="w-full border border-border px-1 py-0.5 text-sm"
							/>
							<div class="flex gap-2">
								<button onclick={() => saveEdit(entry)} class="bg-primary px-2 py-0.5 text-sm text-white">Save</button>
								<button onclick={cancelEdit} class="text-sm text-text-secondary hover:text-text-primary">Cancel</button>
							</div>
						</div>
					{:else if deletingId === entry.id}
						<!-- Delete confirmation -->
						<div class="flex items-center gap-2 px-1">
							<span class="text-sm text-text-primary">Delete this entry?</span>
							<button onclick={() => confirmDelete(entry.id)} class="text-sm text-timer-stopped hover:underline">Yes</button>
							<button onclick={() => (deletingId = null)} class="text-sm text-text-secondary hover:text-text-primary">No</button>
						</div>
					{:else}
						<!-- Display mode -->
						<div class="flex items-start justify-between px-1">
							<div class="min-w-0 flex-1">
								<div class="text-sm text-text-primary">
									<span class="font-mono">{formatTime(entry.startTime)}</span>
									{#if entry.endTime}
										<span class="text-text-secondary"> – </span>
										<span class="font-mono">{formatTime(entry.endTime)}</span>
										<span class="ml-1 text-text-secondary">({formatDurationShort(entry.duration)})</span>
									{:else}
										<span class="ml-1 text-timer-active">(running)</span>
									{/if}
								</div>
								<div class="text-sm text-text-secondary">
									{taskMap[entry.taskId]?.name ?? 'Unknown task'}
									<span class="text-text-secondary/60">·</span>
									{projectMap[entry.projectId]?.name ?? 'Unknown project'}
								</div>
								{#if entry.tags && entry.tags.length > 0}
									<div class="text-xs text-text-secondary">
										{entry.tags.map((t) => `#${t}`).join(' ')}
									</div>
								{/if}
								{#if entry.comment}
									<div class="text-xs text-text-secondary italic">"{entry.comment}"</div>
								{/if}
							</div>
							<div class="flex shrink-0 gap-1">
								<button onclick={() => startEdit(entry)} class="text-xs text-text-secondary hover:text-primary" title="Edit">Edit</button>
								<button onclick={() => (deletingId = entry.id)} class="text-xs text-text-secondary hover:text-timer-stopped" title="Delete">Del</button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>

	<!-- Daily total footer -->
	{#if entries.data.length > 0}
		<div class="border-t border-border pt-1.5">
			<span class="text-sm font-semibold text-text-primary">Total: {formatDurationShort(dailyTotal)}</span>
		</div>
	{/if}
</div>
