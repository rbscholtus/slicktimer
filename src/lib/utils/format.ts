export function formatDuration(totalSeconds: number): string {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const mm = String(minutes).padStart(2, '0');
	const ss = String(seconds).padStart(2, '0');
	return `${hours}:${mm}:${ss}`;
}

export function formatDurationShort(totalSeconds: number): string {
	const rounded = totalSeconds + 30; // round to nearest minute
	const hours = Math.floor(rounded / 3600);
	const minutes = Math.floor((rounded % 3600) / 60);
	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}
	return `${minutes}m`;
}

export function todayDateString(timestamp?: number): string {
	const now = timestamp ? new Date(timestamp) : new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}
