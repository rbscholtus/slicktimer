<script lang="ts">
	import { page } from '$app/stores';
	import { signOut } from 'firebase/auth';
	import { auth } from '$lib/firebase/config';

	const links = [
		{ href: '/timer', label: 'Timer' },
		{ href: '/entries', label: 'Entries' },
		{ href: '/reports', label: 'Reports' }
	];

	function logout() {
		signOut(auth);
	}
</script>

<nav class="border-b border-border px-2 py-1">
	<div class="flex items-center justify-between">
		<div class="flex gap-3">
			{#each links as link}
				<a
					href={link.href}
					class="text-sm {$page.url.pathname === link.href
						? 'text-primary font-semibold'
						: 'text-text-secondary hover:text-text-primary'}"
				>
					{link.label}
				</a>
			{/each}
		</div>
		<button onclick={logout} class="text-sm text-text-secondary hover:text-text-primary">
			Logout
		</button>
	</div>
</nav>
