<script lang="ts">
	import { page } from '$app/stores';
	import { signOut } from 'firebase/auth';
	import { auth } from '$lib/firebase/config';

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/entries', label: 'Entries' },
		{ href: '/tasks', label: 'Tasks' },
		{ href: '/projects', label: 'Projects' },
		{ href: '/reports', label: 'Reports' }
	];

	function logout() {
		signOut(auth);
	}
</script>

<nav class="bg-nav-bar px-2 py-0">
	<div class="flex items-center justify-between">
		<div class="flex">
			{#each links as link}
				{#if $page.url.pathname === link.href}
					<span
						class="border-x border-t border-nav-hover bg-nav-active-bg px-1.5 py-0.5 text-sm text-nav-active-text"
					>
						{link.label}
					</span>
				{:else}
					<a
						href={link.href}
						class="px-1.5 py-0.5 text-sm text-nav-text hover:border-x hover:border-t hover:border-nav-hover hover:bg-nav-hover hover:text-primary"
					>
						{link.label}
					</a>
				{/if}
			{/each}
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
