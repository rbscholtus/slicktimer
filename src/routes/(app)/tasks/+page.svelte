<script lang="ts">
	import { getUser } from '$lib/firebase/auth.svelte';
	import { useCollection } from '$lib/firebase/firestore.svelte';
	import { db } from '$lib/firebase/config';
	import {
		doc,
		updateDoc,
		getDocs,
		collection,
		query,
		where,
		Timestamp,
		writeBatch
	} from 'firebase/firestore';
	import type { Project, Task, TimeEntry } from '$lib/firebase/types';
	import { formatDurationShort } from '$lib/utils/format';

	const user = getUser();
	const uid = $derived(user.current?.uid ?? '');

	const projects = useCollection<Project>(() => (uid ? `users/${uid}/projects` : null));
	const tasks = useCollection<Task>(() => (uid ? `users/${uid}/tasks` : null));
	const timeEntries = useCollection<TimeEntry>(() => (uid ? `users/${uid}/timeEntries` : null));

	// Per-task entry count and total duration (completed entries only)
	const taskEntryStats = $derived(() => {
		const stats: Record<string, { count: number; totalSeconds: number }> = {};
		for (const e of timeEntries.data) {
			if (e.endTime === null) continue;
			if (!stats[e.taskId]) stats[e.taskId] = { count: 0, totalSeconds: 0 };
			stats[e.taskId].count += 1;
			stats[e.taskId].totalSeconds += e.duration ?? 0;
		}
		return stats;
	});

	let showArchived = $state(false);

	const tasksByProject = $derived(() => {
		const sorted = projects.data.slice().sort((a, b) => a.order - b.order);
		return sorted
			.map((p) => ({
				project: p,
				tasks: tasks.data
					.filter((t) => {
						if (t.projectId !== p.id) return false;
						if (t.status === 'archived') return showArchived;
						return true;
					})
					.sort((a, b) => a.order - b.order)
			}))
			.filter((g) => g.tasks.length > 0);
	});

	// ── Edit state ────────────────────────────────────────────────
	let editingId = $state<string | null>(null);
	let editName = $state('');
	let editProjectId = $state('');
	let editTagsStr = $state('');
	let editError = $state('');

	function startEdit(task: Task) {
		editingId = task.id;
		editName = task.name;
		editProjectId = task.projectId;
		editTagsStr = task.tags.join(', ');
		editError = '';
		deletingId = null;
	}

	function cancelEdit() {
		editingId = null;
		editError = '';
	}

	async function saveEdit(task: Task) {
		if (!uid) return;
		editError = '';
		const name = editName.trim();
		if (!name) {
			editError = 'Task name is required.';
			return;
		}
		const tags = editTagsStr
			.split(',')
			.map((t) => t.trim().replace(/^#/, ''))
			.filter(Boolean);
		await updateDoc(doc(db, `users/${uid}/tasks/${task.id}`), {
			name,
			projectId: editProjectId,
			tags,
			updatedAt: Timestamp.now()
		});
		editingId = null;
	}

	// ── Complete / uncomplete ─────────────────────────────────────
	let taskErrors = $state<Record<string, string>>({});

	async function toggleComplete(task: Task) {
		if (!uid) return;
		taskErrors = { ...taskErrors, [task.id]: '' };
		if (task.status === 'active') {
			const running = await isTaskRunning(task.id);
			if (running) {
				taskErrors = {
					...taskErrors,
					[task.id]: 'Task is currently running. Stop the timer first.'
				};
				return;
			}
			await updateDoc(doc(db, `users/${uid}/tasks/${task.id}`), {
				status: 'completed',
				completedAt: Timestamp.now(),
				updatedAt: Timestamp.now()
			});
		} else if (task.status === 'completed') {
			await updateDoc(doc(db, `users/${uid}/tasks/${task.id}`), {
				status: 'active',
				completedAt: null,
				updatedAt: Timestamp.now()
			});
		}
	}

	// ── Archive (complete-then-archive if active) ─────────────────
	async function archiveTask(task: Task) {
		if (!uid) return;
		taskErrors = { ...taskErrors, [task.id]: '' };
		const running = await isTaskRunning(task.id);
		if (running) {
			taskErrors = {
				...taskErrors,
				[task.id]: 'Task is currently running. Stop the timer first.'
			};
			return;
		}
		const now = Timestamp.now();
		await updateDoc(doc(db, `users/${uid}/tasks/${task.id}`), {
			status: 'archived',
			completedAt: task.completedAt ?? now,
			updatedAt: now
		});
	}

	async function unarchiveTask(task: Task) {
		if (!uid) return;
		await updateDoc(doc(db, `users/${uid}/tasks/${task.id}`), {
			status: 'active',
			completedAt: null,
			updatedAt: Timestamp.now()
		});
	}

	// ── Delete ────────────────────────────────────────────────────
	let deletingId = $state<string | null>(null);
	let deletingEntryCount = $state(0);
	let deleteLoading = $state(false);

	async function startDelete(task: Task) {
		if (!uid) return;
		editingId = null;
		deleteLoading = true;
		deletingId = task.id;
		const snap = await getDocs(
			query(collection(db, `users/${uid}/timeEntries`), where('taskId', '==', task.id))
		);
		deletingEntryCount = snap.size;
		deleteLoading = false;
	}

	async function confirmDelete(taskId: string) {
		if (!uid) return;
		const batch = writeBatch(db);
		const snap = await getDocs(
			query(collection(db, `users/${uid}/timeEntries`), where('taskId', '==', taskId))
		);
		snap.docs.forEach((d) => batch.delete(d.ref));
		batch.delete(doc(db, `users/${uid}/tasks/${taskId}`));
		await batch.commit();
		deletingId = null;
	}

	// ── Helpers ───────────────────────────────────────────────────
	async function isTaskRunning(taskId: string): Promise<boolean> {
		if (!uid) return false;
		const snap = await getDocs(
			query(
				collection(db, `users/${uid}/timeEntries`),
				where('taskId', '==', taskId),
				where('endTime', '==', null)
			)
		);
		return !snap.empty;
	}

	// ── Keyboard ──────────────────────────────────────────────────
	const editingTask = $derived(
		editingId ? (tasks.data.find((t) => t.id === editingId) ?? null) : null
	);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			if (editingTask) saveEdit(editingTask);
		}
		if (e.key === 'Escape') {
			if (deletingId !== null) {
				e.preventDefault();
				deletingId = null;
			} else if (editingId !== null) {
				e.preventDefault();
				cancelEdit();
			}
		}
	}
</script>

<svelte:head>
	<title>SlickTimer — Edit Tasks</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="flex h-full flex-col overflow-hidden px-2 py-2">
	<!-- Header -->
	<div class="flex items-center justify-between pb-2">
		<h1 class="text-sm font-semibold text-text-primary">Edit Tasks</h1>
		<button
			onclick={() => (showArchived = !showArchived)}
			class="text-xs text-text-secondary hover:text-text-primary"
		>
			{showArchived ? 'Hide archived' : 'Show archived'}
		</button>
	</div>

	<!-- Task list -->
	<div class="min-h-0 flex-1 space-y-3 overflow-y-auto">
		{#if tasks.loading || projects.loading}
			<p class="text-sm text-text-secondary">Loading...</p>
		{:else if tasksByProject().length === 0}
			<p class="text-sm text-text-secondary">No tasks yet.</p>
		{:else}
			{#each tasksByProject() as group}
				<div>
					<!-- Project header -->
					<div class="mb-1 flex items-center gap-1.5">
						{#if group.project.color}
							<span
								class="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
								style="background-color: {group.project.color}"
							></span>
						{/if}
						<span class="text-sm font-bold text-text-primary">
							{group.project.name}
						</span>
						{#if group.project.tags && group.project.tags.length > 0}
							<span class="text-xs text-text-secondary">
								{group.project.tags.map((t) => `#${t}`).join(' ')}
							</span>
						{/if}
					</div>

					<!-- Tasks -->
					<div class="space-y-1">
						{#each group.tasks as task}
							{@const stats = taskEntryStats()[task.id]}
							<div
								class="rounded border px-2 py-1.5"
								class:bg-bg-entry={task.status === 'active'}
								class:border-border-entry={task.status === 'active'}
								class:bg-bg-alt={task.status !== 'active'}
								class:border-border={task.status !== 'active'}
								class:opacity-60={task.status === 'archived'}
							>
								{#if editingId === task.id}
									<!-- Edit form -->
									<div class="space-y-1">
										<input
											type="text"
											bind:value={editName}
											class="w-full border border-border px-1 py-0.5 text-sm"
											placeholder="Task name"
										/>
										<select
											bind:value={editProjectId}
											class="w-full border border-border px-1 py-0.5 text-sm"
										>
											{#each projects.data as p}
												<option value={p.id}>{p.name}</option>
											{/each}
										</select>
										<input
											type="text"
											bind:value={editTagsStr}
											class="w-full border border-border px-1 py-0.5 text-sm"
											placeholder="Tags: billable, client (comma-separated)"
										/>
										{#if editError}
											<p class="text-xs text-timer-stopped">{editError}</p>
										{/if}
										<div class="flex gap-2">
											<button
												onclick={() => saveEdit(task)}
												class="bg-primary px-2 py-0.5 text-sm text-white hover:bg-primary/90"
											>Save</button>
											<button
												onclick={cancelEdit}
												class="text-sm text-text-secondary hover:text-text-primary"
											>Cancel</button>
										</div>
									</div>
								{:else if deletingId === task.id}
									<!-- Delete confirmation -->
									<div class="space-y-1">
										{#if deleteLoading}
											<p class="text-sm text-text-secondary">Counting entries...</p>
										{:else}
											<p class="text-sm text-text-primary">
												Delete <strong>{task.name}</strong>?
												{#if deletingEntryCount > 0}
													This will also delete
													<strong>{deletingEntryCount}</strong>
													{deletingEntryCount === 1 ? 'time entry' : 'time entries'}.
												{:else}
													No time entries will be deleted.
												{/if}
											</p>
											<div class="flex gap-2">
												<button
													onclick={() => confirmDelete(task.id)}
													class="text-sm text-timer-stopped hover:underline"
												>Yes, delete</button>
												<button
													onclick={() => (deletingId = null)}
													class="text-sm text-text-secondary hover:text-text-primary"
												>Cancel</button>
											</div>
										{/if}
									</div>
								{:else}
									<!-- Display row -->
									<div class="flex items-center gap-2">
										{#if task.status !== 'archived'}
											<input
												type="checkbox"
												checked={task.status === 'completed'}
												onchange={() => toggleComplete(task)}
												class="shrink-0 cursor-pointer"
												title={task.status === 'completed' ? 'Mark active' : 'Mark complete'}
											/>
										{/if}
										<div class="min-w-0 flex-1">
											<span
												class="text-sm text-text-primary"
												class:line-through={task.status === 'completed'}
												class:text-text-secondary={task.status === 'archived'}
											>{task.name}</span>
											{#if task.tags && task.tags.length > 0}
												<span class="ml-1.5 text-xs text-text-secondary">
													{task.tags.map((t) => `#${t}`).join(' ')}
												</span>
											{/if}
											{#if task.status === 'archived'}
												<span class="ml-1.5 text-xs italic text-text-secondary">archived</span>
											{/if}
											{#if stats}
												<span class="ml-1.5 text-xs text-text-secondary">
													· {stats.count} {stats.count === 1 ? 'entry' : 'entries'}, {formatDurationShort(stats.totalSeconds)}
												</span>
											{/if}
										</div>
										{#if taskErrors[task.id]}
											<p class="shrink-0 text-xs text-timer-stopped">{taskErrors[task.id]}</p>
										{/if}
										<div class="flex shrink-0 items-center gap-1.5">
											{#if task.status === 'archived'}
												<button
													onclick={() => unarchiveTask(task)}
													class="text-xs text-text-secondary hover:text-primary"
												>Un-archive</button>
											{:else}
												<button
													onclick={() => startEdit(task)}
													class="text-xs text-text-secondary hover:text-primary"
												>Edit</button>
												<span class="text-xs text-text-secondary">·</span>
												<button
													onclick={() => archiveTask(task)}
													class="text-xs text-text-secondary hover:text-text-primary"
												>Archive</button>
											{/if}
											<span class="text-xs text-text-secondary">·</span>
											<button
												onclick={() => startDelete(task)}
												class="text-xs text-text-secondary hover:text-timer-stopped"
											>Delete</button>
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
