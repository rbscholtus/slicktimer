<script lang="ts">
	import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
	import { db } from '$lib/firebase/config';
	import type { Project, Task } from '$lib/firebase/types';

	let { uid, projects, tasks, taskCount, open, onOpen, onClose, onStartTask } = $props<{
		uid: string;
		projects: Project[];
		tasks: Task[];
		taskCount: number;
		open: boolean;
		onOpen: () => void;
		onClose: () => void;
		onStartTask: (taskId: string, task: Task) => void;
	}>();

	let rawName = $state('');
	let selectedProjectId = $state('');
	let error = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);

	// Parse #tags from the task name
	function parseNameAndTags(input: string): { name: string; tags: string[] } {
		const tags: string[] = [];
		const name = input
			.replace(/#(\w+)/g, (_, tag) => {
				tags.push(tag);
				return '';
			})
			.trim();
		return { name, tags };
	}

	// Auto-focus when opened
	$effect(() => {
		if (open && inputEl) {
			inputEl.focus();
		}
	});

	async function submit(startImmediately: boolean) {
		if (!rawName.trim() || !selectedProjectId) return;

		const { name, tags } = parseNameAndTags(rawName);
		if (!name) return;

		// Check for duplicate task name within the selected project (case-insensitive)
		const duplicate = tasks.some(
			(t) => t.projectId === selectedProjectId && t.name.toLowerCase() === name.toLowerCase()
		);
		if (duplicate) {
			error = 'A task with this name already exists in this project.';
			return;
		}

		error = '';
		const ref = await addDoc(collection(db, `users/${uid}/tasks`), {
			name,
			projectId: selectedProjectId,
			tags,
			status: 'active',
			order: taskCount,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
			completedAt: null
		});

		if (startImmediately) {
			const newTask: Task = {
				id: ref.id,
				name,
				projectId: selectedProjectId,
				tags,
				status: 'active',
				order: taskCount,
				createdAt: null as never,
				updatedAt: null as never,
				completedAt: null
			};
			onStartTask(ref.id, newTask);
		}

		rawName = '';
		onClose();
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		submit(false);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			submit(true);
		}
	}

	// Auto-select first project
	$effect(() => {
		if (projects.length > 0 && !selectedProjectId) {
			selectedProjectId = projects[0].id;
		}
	});
</script>

{#if projects.length === 0}
	<div class="px-2 py-1 text-xs text-text-secondary">Create a project first.</div>
{:else if open}
	<div class="border-b border-border bg-bg-edit px-2 py-2">
		<form onsubmit={handleSubmit} class="space-y-1">
			<select
				bind:value={selectedProjectId}
				class="w-full border border-border px-2 py-1 text-sm focus:outline-primary"
			>
				{#each projects as project}
					<option value={project.id}>{project.name}</option>
				{/each}
			</select>
			<input
				bind:this={inputEl}
				type="text"
				bind:value={rawName}
				oninput={() => (error = '')}
				onkeydown={handleKeydown}
				placeholder="Task name #tag1 #tag2"
				required
				class="w-full border border-border px-2 py-1 text-sm focus:outline-primary"
			/>
			{#if error}
				<div class="text-xs text-timer-stopped">{error}</div>
			{/if}
			<div class="flex gap-1">
				<button type="submit" class="bg-primary px-2 py-1 text-xs text-white hover:bg-primary-hover">
					Add Task
				</button>
				<button
					type="button"
					onclick={() => submit(true)}
					class="bg-timer-active px-2 py-1 text-xs text-white hover:opacity-90"
					title="Add task and start timing immediately (⌘Enter / Ctrl+Enter)"
				>
					Add &amp; Start
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
		+ Add Task
	</button>
{/if}
