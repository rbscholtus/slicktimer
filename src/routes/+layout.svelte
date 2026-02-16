<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import { getUser } from '$lib/firebase/auth.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { children } = $props();
	const user = getUser();

	$effect(() => {
		if (!user.loading && !user.current && $page.url.pathname !== '/login') {
			goto('/login');
		}
	});
</script>

{#if user.loading}
	<div class="flex h-screen items-center justify-center">
		<p class="text-sm text-text-secondary">Loading...</p>
	</div>
{:else if user.current}
	<Nav />
	<main class="flex w-full flex-col overflow-hidden" style="height: calc(100dvh - 34px)">
		{@render children()}
	</main>
{:else}
	{@render children()}
{/if}
