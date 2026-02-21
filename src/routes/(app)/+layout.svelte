<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import { getUser } from '$lib/firebase/auth.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { children } = $props();
	const user = getUser();

	const isTimer = $derived($page.url.pathname === '/timer');

	$effect(() => {
		if (!user.loading && !user.current) {
			goto('/login');
		}
	});

	function openInMainWindow(path: string) {
		if (window.opener && !window.opener.closed) {
			window.opener.location.href = path;
			window.opener.focus();
		} else {
			window.open(path, '_blank');
		}
	}

</script>

{#if user.loading}
	<div class="flex h-screen items-center justify-center">
		<p class="text-sm text-text-secondary">Loading...</p>
	</div>
{:else if user.current}
	{#if isTimer}
		<nav class="bg-nav-bar px-2 py-0">
			<div class="flex items-center">
				<span class="mr-2 flex items-center gap-1 py-0.5">
					<img src="/favicon-32x32.png" alt="SlickTimer" class="h-5 w-5" />
					<span class="text-sm tracking-wide text-white">SLICK<span class="font-bold">TIMER</span></span>
				</span>
				<button
					onclick={() => openInMainWindow('/entries')}
					class="px-1.5 py-0.5 text-sm text-nav-text hover:bg-nav-hover hover:text-primary"
				>
					Entries
				</button>
				<button
					onclick={() => openInMainWindow('/reports')}
					class="px-1.5 py-0.5 text-sm text-nav-text hover:bg-nav-hover hover:text-primary"
				>
					Reports
				</button>
			</div>
		</nav>
	{:else}
		<Nav />
	{/if}
	<main class="flex w-full flex-col overflow-hidden" style="height: calc(100dvh - 26px)">
		{@render children()}
	</main>
{/if}
