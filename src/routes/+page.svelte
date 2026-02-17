<script lang="ts">
	function openTimer() {
		window.open('/timer', 'slicktimer', 'width=300,height=640,resizable=yes');
	}
</script>

<svelte:head>
	<title>SlickTimer</title>
</svelte:head>

<div class="mx-auto max-w-lg px-6 py-8">
	<div class="flex items-center justify-between">
		<h1 class="text-lg font-semibold text-text-primary">SlickTimer</h1>
		<button onclick={openTimer} class="text-sm text-primary hover:underline">
			Open Timer &rarr;
		</button>
	</div>

	<div class="mt-8">
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

	<div class="mt-8 border-t border-border pt-4">
		<a href="/login" class="text-sm text-primary hover:underline">Sign In / Sign Up</a>
	</div>
</div>
