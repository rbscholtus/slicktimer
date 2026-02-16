<script lang="ts">
	import type { Task } from '$lib/firebase/types';
	import { formatDuration } from '$lib/utils/format';

	let {
		task,
		isRunning,
		isActiveTask = false,
		duration,
		entryElapsed = null,
		showEntryTime = false,
		onToggleDuration = null,
		onclick,
		onComplete,
		onUncomplete,
		onArchive
	} = $props<{
		task: Task;
		isRunning: boolean;
		isActiveTask?: boolean;
		duration: number | null;
		entryElapsed?: number | null;
		showEntryTime?: boolean;
		onToggleDuration?: (() => void) | null;
		onclick: () => void;
		onComplete: () => void;
		onUncomplete: () => void;
		onArchive: () => void;
	}>();

	const displayDuration = $derived(
		isRunning && entryElapsed !== null && showEntryTime ? entryElapsed : duration
	);

	const isCompleted = $derived(task.status === 'completed');

	function handleCheckbox(e: Event) {
		e.stopPropagation();
		if (isCompleted) {
			onUncomplete();
		} else {
			onComplete();
		}
	}

	function handleArchive(e: Event) {
		e.stopPropagation();
		onArchive();
	}
</script>

<div
	class="group flex w-full items-center border-b border-border px-2 py-1 text-sm
		{isRunning ? 'bg-timer-active/10' : isCompleted ? 'bg-bg-alt' : isActiveTask ? 'bg-text-secondary/8 hover:bg-text-secondary/12' : 'hover:bg-bg-alt'}"
>
	<!-- Drag hint (visual only — dndzone allows drag from anywhere in the row) -->
	<span class="mr-1 shrink-0 cursor-grab text-text-secondary opacity-0 group-hover:opacity-100 active:cursor-grabbing select-none">&#8942;&#8942;</span>

	<!-- Checkbox -->
	<button
		type="button"
		onclick={handleCheckbox}
		class="mr-1 shrink-0 text-text-secondary hover:text-primary"
		title={isCompleted ? 'Mark active' : 'Mark complete'}
		aria-label={isCompleted ? 'Mark active' : 'Mark complete'}
	>
		{#if isCompleted}
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none" class="text-timer-active">
				<rect x="0.5" y="0.5" width="13" height="13" rx="1.5" stroke="currentColor" />
				<path d="M3 7l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		{:else}
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
				<rect x="0.5" y="0.5" width="13" height="13" rx="1.5" stroke="currentColor" />
			</svg>
		{/if}
	</button>

	<!-- Task name (clickable to start/stop) -->
	<button
		type="button"
		{onclick}
		disabled={isCompleted}
		class="min-w-0 flex-1 text-left
			{isCompleted ? 'cursor-default' : 'cursor-pointer'}
			{isRunning ? 'font-semibold text-text-primary' : 'text-text-primary'}"
	>
		<span class="{isCompleted ? 'line-through text-text-secondary' : ''}">{task.name}</span>
		{#if task.tags.length > 0}
			<span class="ml-1 text-xs text-text-secondary">
				{task.tags.map((t) => `#${t}`).join(' ')}
			</span>
		{/if}
	</button>

	<!-- Duration -->
	{#if displayDuration !== null}
		{#if isRunning && onToggleDuration}
			<button
				type="button"
				onclick={(e) => { e.stopPropagation(); onToggleDuration!(); }}
				class="ml-2 shrink-0 font-mono text-xs text-timer-active hover:underline cursor-pointer"
				title={showEntryTime ? 'Show today\'s total' : 'Show this entry\'s time'}
				aria-label={showEntryTime ? 'Show today\'s total' : 'Show this entry\'s time'}
			>
				{formatDuration(displayDuration)}
			</button>
		{:else}
			<span class="ml-2 shrink-0 font-mono text-xs {isRunning ? 'text-timer-active' : 'text-text-secondary'}">
				{formatDuration(displayDuration)}
			</span>
		{/if}
	{/if}

	<!-- Archive button (only for completed tasks) -->
	{#if isCompleted}
		<button
			type="button"
			onclick={handleArchive}
			class="ml-1 shrink-0 text-xs text-text-secondary hover:text-timer-stopped"
			title="Archive task"
			aria-label="Archive task"
		>
			<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
				<path d="M1 3.5h10M2 3.5V10h8V3.5M4.5 3.5V2h3v1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>
	{/if}
</div>
