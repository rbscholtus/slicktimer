<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="py-8 text-center">
	<h1 class="text-lg font-semibold text-text-primary">{$page.status}</h1>
	<p class="mt-1 text-sm text-text-secondary">{$page.error?.message}</p>
</div>
