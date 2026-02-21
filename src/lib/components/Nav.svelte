<script lang="ts">
	import { page } from '$app/stores';
	import { signOut } from 'firebase/auth';
	import { auth } from '$lib/firebase/config';
	import { getUser } from '$lib/firebase/auth.svelte';

	const user = getUser();

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/entries', label: 'Edit Entries' },
		{ href: '/tasks', label: 'Edit Tasks' },
		{ href: '/projects', label: 'Edit Projects' },
		{ href: '/reports', label: 'Run Reports' }
	];

	function logout() {
		signOut(auth);
	}

	function openTimer() {
		window.open('/timer', 'slicktimer', 'width=300,height=640,resizable=yes');
	}
</script>

<nav class="bg-nav-bar px-2 py-0">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-1">
			<a href="/" class="mr-1 flex items-center gap-1 py-0.5">
				<img src="/favicon-32x32.png" alt="SlickTimer" class="h-5 w-5" />
				<span class="text-sm tracking-wide text-white">SLICK<span class="font-bold">TIMER</span></span>
			</a>
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
						class="border-x border-t border-transparent px-1.5 py-0.5 text-sm text-nav-text hover:border-nav-hover hover:bg-nav-hover hover:text-primary"
					>
						{link.label}
					</a>
				{/if}
			{/each}
		</div>
		<div class="flex items-center gap-2">
			<button
				onclick={openTimer}
				class="py-0.5 text-sm text-nav-text hover:text-nav-active-text hover:bg-nav-hover px-1.5"
			>
				Open Timer
			</button>
			{#if user.current?.email}
				<span class="text-sm text-nav-text opacity-70">{user.current.email}</span>
			{/if}
			<button
				onclick={logout}
				class="py-0.5 text-sm text-nav-text hover:text-nav-active-text hover:bg-nav-hover px-1.5"
			>
				Logout
			</button>
		</div>
	</div>
</nav>
