<script lang="ts">
	import type { Project, Task } from '$lib/firebase/types';
	import TaskRow from './TaskRow.svelte';
	import { dndzone, dragHandleZone, dragHandle, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';

	let {
		tasksByProject,
		runningTaskId,
		activeTaskId,
		taskDurations,
		runningElapsed,
		onTaskClick,
		onCompleteTask,
		onUncompleteTask,
		onArchiveTask,
		onReorderTasks,
		onReorderProjects
	} = $props<{
		tasksByProject: { project: Project; tasks: Task[] }[];
		runningTaskId: string | null;
		activeTaskId: string | null;
		taskDurations: Record<string, number>;
		runningElapsed: number;
		onTaskClick: (taskId: string, task: Task) => void;
		onCompleteTask: (taskId: string) => void;
		onUncompleteTask: (taskId: string) => void;
		onArchiveTask: (taskId: string) => void;
		onReorderTasks: (taskIds: string[]) => void;
		onReorderProjects: (projectIds: string[]) => void;
	}>();

	// dndzone requires items to have a top-level `id` property
	type Group = { id: string; project: Project; tasks: Task[] };
	let groups = $state<Group[]>([]);

	let projectDragging = $state(false);
	let taskDragging = $state(false);

	// Duration toggle: show entry elapsed vs today's total for the running task
	let showEntryTime = $state(false);
	$effect(() => {
		// Reset toggle whenever the running task changes or stops
		void runningTaskId;
		showEntryTime = false;
	});

	$effect(() => {
		if (!projectDragging && !taskDragging) {
			groups = tasksByProject.map((g) => ({
				id: g.project.id,
				project: g.project,
				tasks: [...g.tasks]
			}));
		}
	});

	// Snapshots of order taken when a drag starts — used to skip no-op writes
	let projectOrderSnapshot: string[] = [];
	let taskOrderSnapshot: { groupId: string; ids: string[] } | null = null;

	// --- Project-level DnD (via dragHandleZone — only header triggers drag) ---
	function handleProjectConsider(e: CustomEvent<{ items: Group[] }>) {
		if (!projectDragging) {
			projectOrderSnapshot = groups.map((g) => g.id);
		}
		projectDragging = true;
		groups = e.detail.items;
	}

	function handleProjectFinalize(e: CustomEvent<{ items: Group[] }>) {
		projectDragging = false;
		groups = e.detail.items;
		const realGroups = e.detail.items.filter(
			(g) => !(g as never)[SHADOW_ITEM_MARKER_PROPERTY_NAME]
		);
		const newIds = realGroups.map((g) => g.project.id);
		if (newIds.join() !== projectOrderSnapshot.join()) {
			onReorderProjects(newIds);
		}
		projectOrderSnapshot = [];
	}

	// --- Task-level DnD (per project) ---
	function handleTaskConsider(groupId: string, e: CustomEvent<{ items: Task[] }>) {
		if (!taskDragging) {
			const group = groups.find((g) => g.id === groupId);
			taskOrderSnapshot = group
				? { groupId, ids: group.tasks.map((t) => t.id) }
				: null;
		}
		taskDragging = true;
		groups = groups.map((g) => (g.id === groupId ? { ...g, tasks: e.detail.items } : g));
	}

	function handleTaskFinalize(groupId: string, e: CustomEvent<{ items: Task[] }>) {
		taskDragging = false;
		groups = groups.map((g) => (g.id === groupId ? { ...g, tasks: e.detail.items } : g));
		const realTasks = e.detail.items.filter(
			(t) => !(t as never)[SHADOW_ITEM_MARKER_PROPERTY_NAME]
		);
		const newIds = realTasks.map((t) => t.id);
		if (taskOrderSnapshot?.groupId === groupId && newIds.join() !== taskOrderSnapshot.ids.join()) {
			onReorderTasks(newIds);
		}
		taskOrderSnapshot = null;
	}

	const flipMs = 150;
</script>

{#if groups.length === 0}
	<div class="px-2 py-4 text-center text-sm text-text-secondary">
		No tasks yet. Create a project and add tasks below.
	</div>
{:else}
	<div
		use:dragHandleZone={{ items: groups, flipDurationMs: flipMs, type: 'project' }}
		onconsider={handleProjectConsider}
		onfinalize={handleProjectFinalize}
	>
		{#each groups as group (group.id)}
			<div>
				<!-- Project header — drag handle for the whole group block -->
				<div
					use:dragHandle
					class="flex cursor-grab items-center gap-1 bg-bg-alt px-2 py-1 active:cursor-grabbing"
					role="button"
					tabindex="-1"
					aria-label="Drag to reorder project {group.project.name}"
				>
					<span
						class="inline-block h-2 w-2 shrink-0"
						style="background-color: {group.project.color || '#999'}"
					></span>
					<span class="text-xs font-semibold text-text-secondary">{group.project.name}</span>
					<span class="ml-auto text-text-secondary opacity-40 select-none text-xs">&#8942;&#8942;</span>
				</div>

				<!-- Task list for this project -->
				<div
					use:dndzone={{ items: group.tasks, flipDurationMs: flipMs, type: `task-${group.id}` }}
					onconsider={(e) => handleTaskConsider(group.id, e)}
					onfinalize={(e) => handleTaskFinalize(group.id, e)}
				>
					{#each group.tasks as task (task.id)}
						{@const isRunning = runningTaskId === task.id}
						{@const isActive = activeTaskId === task.id}
						{@const completedTotal = taskDurations[task.id] || 0}
						{@const totalDuration = completedTotal + (isRunning ? runningElapsed : 0)}
						{@const showDuration = isActive || task.status === 'completed'}
						<TaskRow
							{task}
							{isRunning}
							isActiveTask={isActive && !isRunning}
							duration={showDuration ? totalDuration : null}
							entryElapsed={isRunning ? runningElapsed : null}
							{showEntryTime}
							onToggleDuration={isRunning ? () => (showEntryTime = !showEntryTime) : null}
							onclick={() => onTaskClick(task.id, task)}
							onComplete={() => onCompleteTask(task.id)}
							onUncomplete={() => onUncompleteTask(task.id)}
							onArchive={() => onArchiveTask(task.id)}
						/>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{/if}
