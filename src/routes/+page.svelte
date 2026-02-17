<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import { getUser } from '$lib/firebase/auth.svelte';

	const user = getUser();

	function openTimer() {
		window.open('/timer', 'slicktimer', 'width=300,height=640,resizable=yes');
	}
</script>

<svelte:head>
	<title>SlickTimer</title>
</svelte:head>

<!-- Nav bar: adapts to login state -->
{#if user.current}
	<Nav />
{:else}
	<nav class="bg-nav-bar px-2 py-0">
		<div class="flex items-center justify-between">
			<div class="flex">
				<span class="border-x border-t border-nav-hover bg-nav-active-bg px-1.5 py-0.5 text-sm text-nav-active-text">
					Home
				</span>
			</div>
			<a href="/login" class="px-1.5 py-0.5 text-sm text-nav-text hover:bg-nav-hover hover:text-primary">
				Login
			</a>
		</div>
	</nav>
{/if}

<div class="mx-auto max-w-lg px-6 py-8">
	<h1 class="text-lg font-semibold text-primary">SlickTimer</h1>

	<div class="mt-6">
		<h2 class="text-base font-semibold text-text-primary">Getting Started</h2>
		<ol class="mt-4 list-inside list-decimal space-y-3 text-sm text-text-secondary">
			<li>
				Go ahead and bookmark the
				<button onclick={openTimer} class="text-primary underline">Open Timer</button>
				link above.
			</li>
			<li>Click the bookmark you just created, SlickTimer will appear in a new window.</li>
			<li>After adding a task, click on the task name to begin tracking your time on that task.</li>
			<li>
				When you're done you can either click on the current task name to stop it or just close the
				SlickTimer window. Don't worry, all your data will be saved.
			</li>
			<li>
				You can then do fun things later like share your tasks, run reports, or edit that time entry
				you goofed. If you have any more questions check out the help or drop me a line.
			</li>
		</ol>
	</div>
</div>
