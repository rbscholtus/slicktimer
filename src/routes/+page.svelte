<script lang="ts">
	import Nav from "$lib/components/Nav.svelte";
	import { getUser } from "$lib/firebase/auth.svelte";

	const user = getUser();

	function openTimer() {
		window.open(
			"/timer",
			"slicktimer",
			"width=300,height=640,resizable=yes",
		);
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
				<span
					class="border-x border-t border-nav-hover bg-nav-active-bg px-1.5 py-0.5 text-sm text-nav-active-text"
				>
					Home
				</span>
			</div>
			<a
				href="/login"
				class="px-1.5 py-0.5 text-sm text-nav-text hover:bg-nav-hover hover:text-primary"
			>
				Login
			</a>
		</div>
	</nav>
{/if}

<div class="mx-auto max-w-lg px-6 py-8">
	<h1 class="text-lg font-semibold text-primary">SlickTimer</h1>

	<div class="mt-6 space-y-4 text-sm text-text-secondary">
		<h2 class="text-base font-semibold text-text-primary">
			Simple timing is back.
		</h2>

		<p>
			SlickTimer is the spiritual successor to the legendary <strong
				>SlimTimer</strong
			>, which tracked over
			<strong>32 million hours</strong> back in the day. SlickTimer picks up
			where the legend left off, carrying forward that "less is more" DNA into
			a slick new package.
		</p>

		<p>
			It has everything you need and nothing you don't—now featuring <strong
				>Project Folders</strong
			>, <strong>Offline Mode</strong>, <strong>Pomodoro mode</strong>, and
			<strong>drag-and-drop reordering</strong> of tasks. Whether you're at
			your desk or off the grid, SlickTimer has your back.
		</p>

		<p>
			Ready to get back to work? Let's
			<button onclick={openTimer} class="text-primary underline"
				>start the clock</button
			>.
		</p>
	</div>
</div>
