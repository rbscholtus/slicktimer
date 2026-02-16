<script lang="ts">
	let { comment, isRunning, open, onOpen, onClose, onSave } = $props<{
		comment: string;
		isRunning: boolean;
		open: boolean;
		onOpen: () => void;
		onClose: () => void;
		onSave: (text: string) => void;
	}>();

	let draft = $state(comment);
	let inputEl = $state<HTMLInputElement | null>(null);

	// Sync draft when comment changes externally (carry-over on new task)
	$effect(() => {
		draft = comment;
	});

	// Auto-focus when opened
	$effect(() => {
		if (open && inputEl) {
			inputEl.focus();
			inputEl.select();
		}
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		onSave(draft.trim());
		onClose();
	}

	// Active = timer running OR there is an active task (stopped state with lingering comment)
	const hasActive = $derived(isRunning || comment !== '');
</script>

{#if !hasActive}
	<!-- Nothing to show when no task has ever been active -->
{:else if open}
	<div class="border-b border-border bg-bg-edit px-2 py-2">
		<form onsubmit={handleSubmit} class="flex gap-1">
			<input
				bind:this={inputEl}
				type="text"
				bind:value={draft}
				placeholder="Comment for this time entry…"
				class="min-w-0 flex-1 border border-border px-2 py-1 text-sm focus:outline-primary"
			/>
			<button type="submit" class="bg-primary px-2 py-1 text-xs text-white hover:bg-primary-hover">
				Save
			</button>
			<button
				type="button"
				onclick={onClose}
				class="px-2 py-1 text-xs text-text-secondary hover:text-text-primary"
			>
				Cancel
			</button>
		</form>
	</div>
{:else}
	<button
		onclick={isRunning ? onOpen : undefined}
		disabled={!isRunning}
		class="flex w-full items-center gap-1 border-b border-border px-2 py-1 text-left text-xs
			{isRunning ? 'cursor-pointer text-text-secondary hover:text-primary' : 'cursor-default text-text-secondary'}"
	>
		<span class="truncate">
			{#if comment}
				<span class="italic">{comment}</span>
			{:else if isRunning}
				+ Add comment
			{/if}
		</span>
	</button>
{/if}
