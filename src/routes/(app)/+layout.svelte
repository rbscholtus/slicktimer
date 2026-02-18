<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import { getUser } from '$lib/firebase/auth.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { signOut } from 'firebase/auth';
	import { auth } from '$lib/firebase/config';

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

	function logout() {
		signOut(auth);
	}
</script>

{#if user.loading}
	<div class="flex h-screen items-center justify-center">
		<p class="text-sm text-text-secondary">Loading...</p>
	</div>
{:else if user.current}
	{#if isTimer}
		<nav class="bg-nav-bar px-2 py-0">
			<div class="flex items-center justify-between">
				<div class="flex">
					<button
						onclick={() => openInMainWindow('/entries')}
						class="px-1.5 py-0.5 text-sm text-nav-text hover:bg-nav-hover hover:text-primary"
					>
						Edit Entries
					</button>
					<button
						onclick={() => openInMainWindow('/reports')}
						class="px-1.5 py-0.5 text-sm text-nav-text hover:bg-nav-hover hover:text-primary"
					>
						Run Reports
					</button>
				</div>
				<div class="flex items-center gap-2">
					<button
						onclick={logout}
						class="py-0.5 text-sm text-nav-text hover:text-nav-active-text hover:bg-nav-hover px-1.5"
					>
						Logout
					</button>
				</div>
			</div>
		</nav>
	{:else}
		<Nav />
	{/if}
	<main class="flex w-full flex-col overflow-hidden" style="height: calc(100dvh - 26px)">
		{@render children()}
	</main>
{/if}
