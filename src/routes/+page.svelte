<script lang="ts">
	import { getUser } from '$lib/firebase/auth.svelte';

	const user = getUser();
</script>

<svelte:head>
	<title>SlickTimer</title>
</svelte:head>

<div class="py-2">
	<p class="text-sm text-text-secondary">
		Welcome, {user.current?.displayName || user.current?.email}
	</p>
	<p class="mt-2 text-sm text-text-secondary">Timer screen coming soon.</p>
</div>
