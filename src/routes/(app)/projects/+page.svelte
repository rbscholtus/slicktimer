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
	import type { Project, Task } from '$lib/firebase/types';

	const user = getUser();
	const uid = $derived(user.current?.uid ?? '');

	const projects = useCollection<Project>(() => (uid ? `users/${uid}/projects` : null));
	const tasks = useCollection<Task>(() => (uid ? `users/${uid}/tasks` : null));

	// Task counts per project
	const taskCounts = $derived(() => {
		const counts: Record<string, { active: number; completed: number; archived: number }> = {};
		for (const t of tasks.data) {
			if (!counts[t.projectId]) counts[t.projectId] = { active: 0, completed: 0, archived: 0 };
			counts[t.projectId][t.status] += 1;
		}
		return counts;
	});

	// ── Edit state ────────────────────────────────────────────────
	let editingId = $state<string | null>(null);
	let editName = $state('');
	let editColor = $state('#4a90d9');
	let editTagsStr = $state('');
	let editError = $state('');
	// Snapshot of values when editing started, to detect actual changes
	let editOriginalName = $state('');
	let editOriginalColor = $state('');
	let editOriginalTagsStr = $state('');

	async function saveEditIfChanged(project: Project) {
		const name = editName.trim();
		if (!name) {
			editError = 'Project name is required.';
			return;
		}
		const tags = editTagsStr
			.split(',')
			.map((t) => t.trim().replace(/^#/, ''))
			.filter(Boolean);
		const tagsStr = tags.join(', ');
		// Only write if something actually changed
		const changed =
			name !== editOriginalName ||
			editColor !== editOriginalColor ||
			tagsStr !== editOriginalTagsStr;
		if (changed && uid) {
			editError = '';
			await updateDoc(doc(db, `users/${uid}/projects/${project.id}`), {
				name,
				color: editColor,
				tags,
				updatedAt: Timestamp.now()
			});
		}
		editingId = null;
		editError = '';
	}

	function startEdit(project: Project) {
		// Auto-save any in-progress edit before switching
		if (editingId && editingId !== project.id) {
			const prev = projects.data.find((p) => p.id === editingId);
			if (prev) saveEditIfChanged(prev);
		}
		editingId = project.id;
		editName = project.name;
		editColor = project.color || '#4a90d9';
		editTagsStr = (project.tags ?? []).join(', ');
		editOriginalName = project.name;
		editOriginalColor = project.color || '#4a90d9';
		editOriginalTagsStr = (project.tags ?? []).join(', ');
		editError = '';
		deletingId = null;
		completeAllId = null;
		archiveAllId = null;
	}

	function cancelEdit() {
		editingId = null;
		editError = '';
	}

	async function saveEdit(project: Project) {
		await saveEditIfChanged(project);
	}

	// ── Complete all tasks ────────────────────────────────────────
	let completeAllId = $state<string | null>(null);
	let completeAllCount = $state(0);
	let completeAllError = $state('');
	let completeAllLoading = $state(false);

	async function startCompleteAll(project: Project) {
		if (!uid) return;
		editingId = null;
		deletingId = null;
		archiveAllId = null;
		completeAllError = '';
		completeAllLoading = true;
		completeAllId = project.id;

		// Check for running task
		const projectTasks = tasks.data.filter(
			(t) => t.projectId === project.id && t.status === 'active'
		);
		completeAllCount = projectTasks.length;

		for (const t of projectTasks) {
			const snap = await getDocs(
				query(
					collection(db, `users/${uid}/timeEntries`),
					where('taskId', '==', t.id),
					where('endTime', '==', null)
				)
			);
			if (!snap.empty) {
				completeAllError = `"${t.name}" is currently running. Stop the timer first.`;
				completeAllLoading = false;
				return;
			}
		}
		completeAllLoading = false;
	}

	async function confirmCompleteAll(projectId: string) {
		if (!uid) return;
		const projectTasks = tasks.data.filter(
			(t) => t.projectId === projectId && t.status === 'active'
		);
		const batch = writeBatch(db);
		const now = Timestamp.now();
		for (const t of projectTasks) {
			batch.update(doc(db, `users/${uid}/tasks/${t.id}`), {
				status: 'completed',
				completedAt: now,
				updatedAt: now
			});
		}
		await batch.commit();
		completeAllId = null;
	}

	// ── Archive all tasks ─────────────────────────────────────────
	let archiveAllId = $state<string | null>(null);
	let archiveAllCount = $state(0);
	let archiveAllError = $state('');
	let archiveAllLoading = $state(false);

	async function startArchiveAll(project: Project) {
		if (!uid) return;
		editingId = null;
		deletingId = null;
		completeAllId = null;
		archiveAllError = '';
		archiveAllLoading = true;
		archiveAllId = project.id;

		const projectTasks = tasks.data.filter(
			(t) => t.projectId === project.id && t.status !== 'archived'
		);
		archiveAllCount = projectTasks.length;

		// Check for running task
		for (const t of projectTasks) {
			const snap = await getDocs(
				query(
					collection(db, `users/${uid}/timeEntries`),
					where('taskId', '==', t.id),
					where('endTime', '==', null)
				)
			);
			if (!snap.empty) {
				archiveAllError = `"${t.name}" is currently running. Stop the timer first.`;
				archiveAllLoading = false;
				return;
			}
		}
		archiveAllLoading = false;
	}

	async function confirmArchiveAll(projectId: string) {
		if (!uid) return;
		const projectTasks = tasks.data.filter(
			(t) => t.projectId === projectId && t.status !== 'archived'
		);
		const batch = writeBatch(db);
		const now = Timestamp.now();
		for (const t of projectTasks) {
			batch.update(doc(db, `users/${uid}/tasks/${t.id}`), {
				status: 'archived',
				completedAt: t.status === 'active' ? now : t.completedAt,
				updatedAt: now
			});
		}
		await batch.commit();
		archiveAllId = null;
	}

	// ── Delete project ────────────────────────────────────────────
	let deletingId = $state<string | null>(null);
	let deleteTaskCount = $state(0);
	let deleteEntryCount = $state(0);
	let deleteNameInput = $state('');
	let deleteLoading = $state(false);
	let deleteError = $state('');

	const deleteNameMatches = $derived(
		deletingId !== null &&
		deleteNameInput === (projects.data.find((p) => p.id === deletingId)?.name ?? '')
	);

	async function startDelete(project: Project) {
		if (!uid) return;
		editingId = null;
		completeAllId = null;
		archiveAllId = null;
		deleteLoading = true;
		deletingId = project.id;
		deleteNameInput = '';
		deleteError = '';

		const [taskSnap, entrySnap] = await Promise.all([
			getDocs(query(collection(db, `users/${uid}/tasks`), where('projectId', '==', project.id))),
			getDocs(
				query(collection(db, `users/${uid}/timeEntries`), where('projectId', '==', project.id))
			)
		]);
		deleteTaskCount = taskSnap.size;
		deleteEntryCount = entrySnap.size;
		deleteLoading = false;
	}

	async function confirmDeleteProject(projectId: string) {
		if (!uid) return;
		const batch = writeBatch(db);

		const [taskSnap, entrySnap] = await Promise.all([
			getDocs(query(collection(db, `users/${uid}/tasks`), where('projectId', '==', projectId))),
			getDocs(
				query(collection(db, `users/${uid}/timeEntries`), where('projectId', '==', projectId))
			)
		]);
		taskSnap.docs.forEach((d) => batch.delete(d.ref));
		entrySnap.docs.forEach((d) => batch.delete(d.ref));
		batch.delete(doc(db, `users/${uid}/projects/${projectId}`));
		await batch.commit();
		deletingId = null;
	}

	// ── Keyboard ──────────────────────────────────────────────────
	const editingProject = $derived(
		editingId ? (projects.data.find((p) => p.id === editingId) ?? null) : null
	);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			if (editingProject) saveEdit(editingProject);
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			if (deletingId !== null) { deletingId = null; deleteNameInput = ''; }
			else if (completeAllId !== null) { completeAllId = null; }
			else if (archiveAllId !== null) { archiveAllId = null; }
			else if (editingId !== null) { cancelEdit(); }
		}
	}
</script>

<svelte:head>
	<title>SlickTimer — Edit Projects</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="flex h-full flex-col overflow-hidden px-2 py-2">
	<!-- Header -->
	<div class="pb-2">
		<h1 class="text-sm font-semibold text-text-primary">Edit Projects</h1>
	</div>

	<!-- Projects list -->
	<div class="min-h-0 flex-1 space-y-2 overflow-y-auto">
		{#if projects.loading}
			<p class="text-sm text-text-secondary">Loading...</p>
		{:else if projects.data.length === 0}
			<p class="text-sm text-text-secondary">No projects yet.</p>
		{:else}
			{#each projects.data.slice().sort((a, b) => a.order - b.order) as project}
				{@const counts = taskCounts()[project.id] ?? { active: 0, completed: 0, archived: 0 }}
				{@const hasActiveTasks = counts.active > 0}
				{@const hasNonArchivedTasks = counts.active > 0 || counts.completed > 0}
				<div class="rounded border border-border-entry bg-bg-entry p-2">
					{#if editingId === project.id}
						<!-- Edit form -->
						<div class="space-y-1">
							<div class="flex items-center gap-2">
								<input
									type="color"
									bind:value={editColor}
									class="h-7 w-7 shrink-0 cursor-pointer rounded border border-border p-0.5"
									title="Project color"
								/>
								<input
									type="text"
									bind:value={editName}
									class="flex-1 border border-border px-1 py-0.5 text-sm"
									placeholder="Project name"
								/>
							</div>
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
									onclick={() => saveEdit(project)}
									class="bg-primary px-2 py-0.5 text-sm text-white hover:bg-primary/90"
								>Save</button>
								<button
									onclick={cancelEdit}
									class="text-sm text-text-secondary hover:text-text-primary"
								>Cancel</button>
							</div>
						</div>

					{:else if completeAllId === project.id}
						<!-- Complete all confirmation -->
						<div class="space-y-1">
							{#if completeAllLoading}
								<p class="text-sm text-text-secondary">Checking tasks...</p>
							{:else if completeAllError}
								<p class="text-sm text-timer-stopped">{completeAllError}</p>
								<button
									onclick={() => (completeAllId = null)}
									class="text-sm text-text-secondary hover:text-text-primary"
								>Dismiss</button>
							{:else}
								<p class="text-sm text-text-primary">
									Mark all <strong>{completeAllCount}</strong>
									active {completeAllCount === 1 ? 'task' : 'tasks'} in
									<strong>{project.name}</strong> as complete?
								</p>
								<div class="flex gap-2">
									<button
										onclick={() => confirmCompleteAll(project.id)}
										class="text-sm text-primary hover:underline"
									>Yes, complete all</button>
									<button
										onclick={() => (completeAllId = null)}
										class="text-sm text-text-secondary hover:text-text-primary"
									>Cancel</button>
								</div>
							{/if}
						</div>

					{:else if archiveAllId === project.id}
						<!-- Archive all confirmation -->
						<div class="space-y-1">
							{#if archiveAllLoading}
								<p class="text-sm text-text-secondary">Checking tasks...</p>
							{:else if archiveAllError}
								<p class="text-sm text-timer-stopped">{archiveAllError}</p>
								<button
									onclick={() => (archiveAllId = null)}
									class="text-sm text-text-secondary hover:text-text-primary"
								>Dismiss</button>
							{:else}
								<p class="text-sm text-text-primary">
									Archive all <strong>{archiveAllCount}</strong>
									active and completed {archiveAllCount === 1 ? 'task' : 'tasks'} in
									<strong>{project.name}</strong>?
									This will hide the project from the timer.
								</p>
								<div class="flex gap-2">
									<button
										onclick={() => confirmArchiveAll(project.id)}
										class="text-sm text-text-secondary hover:text-text-primary"
									>Yes, archive all</button>
									<button
										onclick={() => (archiveAllId = null)}
										class="text-sm text-text-secondary hover:text-text-primary"
									>Cancel</button>
								</div>
							{/if}
						</div>

					{:else if deletingId === project.id}
						<!-- Delete confirmation -->
						<div class="space-y-1">
							{#if deleteLoading}
								<p class="text-sm text-text-secondary">Counting data...</p>
							{:else}
								<p class="text-sm text-text-primary">
									Delete <strong>{project.name}</strong>? This will permanently delete
									<strong>{deleteTaskCount}</strong>
									{deleteTaskCount === 1 ? 'task' : 'tasks'} and
									<strong>{deleteEntryCount}</strong>
									{deleteEntryCount === 1 ? 'time entry' : 'time entries'}.
								</p>
								<p class="text-xs text-text-secondary">
									Type <strong>{project.name}</strong> to confirm:
								</p>
								<input
									type="text"
									bind:value={deleteNameInput}
									class="w-full border border-border px-1 py-0.5 text-sm"
									placeholder={project.name}
								/>
								{#if deleteError}
									<p class="text-xs text-timer-stopped">{deleteError}</p>
								{/if}
								<div class="flex gap-2">
									<button
										onclick={() => confirmDeleteProject(project.id)}
										disabled={!deleteNameMatches}
										class="text-sm text-timer-stopped hover:underline disabled:cursor-not-allowed disabled:opacity-40"
									>Delete project</button>
									<button
										onclick={() => { deletingId = null; deleteNameInput = ''; }}
										class="text-sm text-text-secondary hover:text-text-primary"
									>Cancel</button>
								</div>
							{/if}
						</div>

					{:else}
						<!-- Display row -->
						<div class="flex items-center gap-2">
							<!-- Color swatch -->
							<span
								class="inline-block h-3.5 w-3.5 shrink-0 rounded-sm border border-border"
								style="background-color: {project.color || '#ccc'}"
							></span>
							<!-- Name + meta -->
							<div class="min-w-0 flex-1">
								<span class="text-sm font-semibold text-text-primary">{project.name}</span>
								<span class="ml-1.5 text-xs text-text-secondary">
									{#if counts.active > 0}<span>{counts.active} active</span>{/if}
									{#if counts.completed > 0}<span class:ml-1={counts.active > 0}>{counts.completed} completed</span>{/if}
									{#if counts.archived > 0}<span class:ml-1={counts.active > 0 || counts.completed > 0}>{counts.archived} archived</span>{/if}
									{#if counts.active === 0 && counts.completed === 0 && counts.archived === 0}0 tasks{/if}
								</span>
								{#if project.tags && project.tags.length > 0}
									<span class="ml-1.5 text-xs text-text-secondary">
										{project.tags.map((t) => `#${t}`).join(' ')}
									</span>
								{/if}
							</div>
							<!-- Actions -->
							<div class="flex shrink-0 items-center gap-1.5">
								<button
									onclick={() => startEdit(project)}
									class="text-xs text-text-secondary hover:text-primary"
								>Edit</button>
								<span class="text-xs text-text-secondary">·</span>
								<button
									onclick={() => startCompleteAll(project)}
									disabled={!hasActiveTasks}
									class="text-xs text-text-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
									title="Mark all active tasks as complete"
								>Complete all</button>
								<span class="text-xs text-text-secondary">·</span>
								<button
									onclick={() => startArchiveAll(project)}
									disabled={!hasNonArchivedTasks}
									class="text-xs text-text-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
									title="Archive all non-archived tasks (hides project from timer)"
								>Archive all</button>
								<span class="text-xs text-text-secondary">·</span>
								<button
									onclick={() => startDelete(project)}
									class="text-xs text-text-secondary hover:text-timer-stopped"
								>Delete</button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
