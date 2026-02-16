<script lang="ts">
	import { formatDurationShort } from '$lib/utils/format';

	let { totalSeconds } = $props<{ totalSeconds: number }>();
</script>

<div class="border-b border-border px-2 py-1">
	<span class="text-xs text-text-secondary">Today:</span>
	<span class="ml-1 text-sm font-semibold text-text-primary">{formatDurationShort(totalSeconds)}</span>
</div>
