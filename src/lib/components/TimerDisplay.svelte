<script lang="ts">
	import { formatDuration } from '$lib/utils/format';

	let {
		totalSeconds,
		isRunning,
		canResume,
		pomodoroActive,
		pomodoroRemaining,
		pomodoroTargetSeconds,
		onPlayPause,
		onTogglePomodoro
	} = $props<{
		totalSeconds: number;
		isRunning: boolean;
		canResume: boolean;
		pomodoroActive: boolean;
		pomodoroRemaining: number;
		pomodoroTargetSeconds: number;
		onPlayPause: () => void;
		onTogglePomodoro: () => void;
	}>();

	const displayTime = $derived(() => {
		if (pomodoroActive && isRunning) {
			if (pomodoroRemaining >= 0) {
				return formatDuration(pomodoroRemaining);
			}
			return '+' + formatDuration(Math.abs(pomodoroRemaining));
		}
		return formatDuration(totalSeconds);
	});
</script>

<div class="flex items-center justify-center gap-3 border-b border-border py-2 px-3">
	<!-- Play / Pause button -->
	<button
		type="button"
		onclick={onPlayPause}
		disabled={!canResume}
		class="shrink-0 {canResume ? 'text-text-secondary hover:text-text-primary' : 'cursor-default text-border'}"
		title={isRunning ? 'Stop timer' : 'Resume timer'}
		aria-label={isRunning ? 'Stop timer' : 'Resume timer'}
	>
		{#if isRunning}
			<!-- Pause icon -->
			<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
				<rect x="3" y="2" width="4" height="14" rx="1"/>
				<rect x="11" y="2" width="4" height="14" rx="1"/>
			</svg>
		{:else}
			<!-- Play icon -->
			<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
				<path d="M4 2.5l12 6.5-12 6.5V2.5z"/>
			</svg>
		{/if}
	</button>

	<!-- Big clock -->
	<div
		class="font-mono text-3xl font-semibold tracking-wider {isRunning
			? pomodoroActive && pomodoroRemaining < 0
				? 'text-notification'
				: 'text-timer-active'
			: 'text-text-secondary'}"
	>
		{displayTime()}
	</div>

	<!-- Pomodoro toggle (hourglass icon, only when running) -->
	{#if isRunning}
		<button
			type="button"
			onclick={onTogglePomodoro}
			class="shrink-0 {pomodoroActive ? 'text-notification' : 'text-text-secondary hover:text-text-primary'}"
			title={pomodoroActive ? 'Pomodoro on — click to disable' : 'Enable pomodoro (25 min)'}
			aria-label={pomodoroActive ? 'Disable pomodoro' : 'Enable pomodoro'}
		>
			<!-- Hourglass icon -->
			<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M4 2h10M4 16h10"/>
				<path d="M5 2v3l4 4-4 4v3M13 2v3l-4 4 4 4v3"/>
			</svg>
		</button>
	{:else}
		<!-- Placeholder to keep layout stable -->
		<span class="w-[18px] shrink-0"></span>
	{/if}
</div>
