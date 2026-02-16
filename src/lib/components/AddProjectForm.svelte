<script lang="ts">
	import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
	import { db } from '$lib/firebase/config';
	import type { Project } from '$lib/firebase/types';

	let { uid, projectCount, projects, open, onOpen, onClose } = $props<{
		uid: string;
		projectCount: number;
		projects: Project[];
		open: boolean;
		onOpen: () => void;
		onClose: () => void;
	}>();

	let name = $state('');
	let color = $state('#4a90d9');
	let error = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);

	const presetColors = ['#4a90d9', '#5cb85c', '#d9534f', '#e8943a', '#8e44ad', '#1abc9c'];

	// Auto-focus when opened
	$effect(() => {
		if (open && inputEl) {
			inputEl.focus();
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) return;

		if (projects.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
			error = 'A project with this name already exists.';
			return;
		}

		error = '';
		await addDoc(collection(db, `users/${uid}/projects`), {
			name: trimmed,
			color,
			tags: [],
			order: projectCount,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});

		name = '';
		color = '#4a90d9';
		onClose();
	}
</script>

{#if open}
	<div class="border-b border-border bg-bg-edit px-2 py-2">
		<form onsubmit={handleSubmit} class="space-y-1">
			<input
				bind:this={inputEl}
				type="text"
				bind:value={name}
				oninput={() => (error = '')}
				placeholder="Project name"
				required
				class="w-full border border-border px-2 py-1 text-sm focus:outline-primary"
			/>
			{#if error}
				<div class="text-xs text-timer-stopped">{error}</div>
			{/if}
			<div class="flex items-center gap-1">
				{#each presetColors as c}
					<button
						type="button"
						onclick={() => (color = c)}
						class="h-4 w-4 border {color === c ? 'border-text-primary' : 'border-border'}"
						style="background-color: {c}"
						title="Select color {c}"
					></button>
				{/each}
			</div>
			<div class="flex gap-1">
				<button type="submit" class="bg-primary px-2 py-1 text-xs text-white hover:bg-primary-hover">
					Create
				</button>
				<button
					type="button"
					onclick={onClose}
					class="px-2 py-1 text-xs text-text-secondary hover:text-text-primary"
				>
					Cancel
				</button>
			</div>
		</form>
	</div>
{:else}
	<button
		onclick={onOpen}
		class="w-full border-b border-border px-2 py-1 text-left text-xs text-text-secondary hover:text-primary"
	>
		+ Add Project
	</button>
{/if}
