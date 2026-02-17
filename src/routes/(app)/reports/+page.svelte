<script lang="ts">
	import { getUser } from '$lib/firebase/auth.svelte';
	import { useCollection, useQuery } from '$lib/firebase/firestore.svelte';
	import { db } from '$lib/firebase/config';
	import { query, where, collection, orderBy } from 'firebase/firestore';
	import { formatDurationShort, todayDateString } from '$lib/utils/format';
	import type { Project, Task, TimeEntry } from '$lib/firebase/types';

	const user = getUser();
	const uid = $derived(user.current?.uid ?? '');

	// Report type: pivot (default) or timesheet
	let reportType = $state<'pivot' | 'timesheet'>('pivot');

	// Time frame
	type Preset = 'today' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';
	let preset = $state<Preset>('today');
	let customStart = $state('');
	let customEnd = $state('');

	function getDateRange(p: Preset): { start: string; end: string } {
		const now = new Date();
		const today = todayDateString();

		if (p === 'today') return { start: today, end: today };

		if (p === 'this_week') {
			const d = new Date(now);
			const day = d.getDay();
			const diff = day === 0 ? 6 : day - 1; // Monday start
			d.setDate(d.getDate() - diff);
			const start = d.toISOString().slice(0, 10);
			const end = today;
			return { start, end };
		}

		if (p === 'last_week') {
			const d = new Date(now);
			const day = d.getDay();
			const diff = day === 0 ? 6 : day - 1;
			d.setDate(d.getDate() - diff - 7);
			const start = d.toISOString().slice(0, 10);
			d.setDate(d.getDate() + 6);
			const end = d.toISOString().slice(0, 10);
			return { start, end };
		}

		if (p === 'this_month') {
			const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
			return { start, end: today };
		}

		if (p === 'last_month') {
			const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			const start = d.toISOString().slice(0, 10);
			const dEnd = new Date(now.getFullYear(), now.getMonth(), 0);
			const end = dEnd.toISOString().slice(0, 10);
			return { start, end };
		}

		// custom
		return { start: customStart || today, end: customEnd || today };
	}

	const dateRange = $derived(getDateRange(preset));

	// Load projects and tasks
	const projects = $derived(uid ? useCollection<Project>(`users/${uid}/projects`) : { data: [] as Project[], loading: true });
	const tasks = $derived(uid ? useCollection<Task>(`users/${uid}/tasks`) : { data: [] as Task[], loading: true });

	// Query entries for date range
	const entriesQuery = $derived(
		uid
			? query(
					collection(db, `users/${uid}/timeEntries`),
					where('date', '>=', dateRange.start),
					where('date', '<=', dateRange.end),
					orderBy('startTime', 'asc')
				)
			: null
	);
	const entries = $derived(entriesQuery ? useQuery<TimeEntry>(entriesQuery) : { data: [] as TimeEntry[], loading: true });

	// Lookup maps
	const projectMap = $derived(Object.fromEntries(projects.data.map((p) => [p.id, p])));
	const taskMap = $derived(Object.fromEntries(tasks.data.map((t) => [t.id, t])));

	// Filters
	let filterProject = $state('');
	let filterTag = $state('');

	// All unique tags from entries
	const allTags = $derived(
		[...new Set(entries.data.flatMap((e) => e.tags || []))].sort()
	);

	// Filtered entries
	const filteredEntries = $derived(
		entries.data.filter((e) => {
			if (e.endTime === null) return false; // skip running entries
			if (filterProject && e.projectId !== filterProject) return false;
			if (filterTag && !(e.tags || []).includes(filterTag)) return false;
			return true;
		})
	);

	// Pivot table state
	type PivotAxis = 'project' | 'task' | 'date';
	let pivotRows = $state<PivotAxis>('project');
	let pivotCols = $state<PivotAxis>('date');

	function getAxisValue(entry: TimeEntry, axis: PivotAxis): string {
		if (axis === 'project') return projectMap[entry.projectId]?.name ?? 'Unknown';
		if (axis === 'task') return taskMap[entry.taskId]?.name ?? 'Unknown';
		if (axis === 'date') return entry.date;
		return '';
	}

	// Pivot grid computation
	const pivotGrid = $derived(() => {
		const grid: Record<string, Record<string, number>> = {};
		const colKeys = new Set<string>();

		for (const entry of filteredEntries) {
			const row = getAxisValue(entry, pivotRows);
			const col = getAxisValue(entry, pivotCols);
			colKeys.add(col);
			if (!grid[row]) grid[row] = {};
			grid[row][col] = (grid[row][col] || 0) + entry.duration;
		}

		const sortedCols = [...colKeys].sort();
		const rowEntries = Object.entries(grid).sort(([a], [b]) => a.localeCompare(b));

		// Row totals
		const rows = rowEntries.map(([name, cols]) => {
			const total = Object.values(cols).reduce((s, v) => s + v, 0);
			return { name, cols, total };
		});

		// Column totals
		const colTotals: Record<string, number> = {};
		let grandTotal = 0;
		for (const col of sortedCols) {
			colTotals[col] = rowEntries.reduce((s, [, cols]) => s + (cols[col] || 0), 0);
			grandTotal += colTotals[col];
		}

		return { rows, cols: sortedCols, colTotals, grandTotal };
	});

	// Timesheet total
	const timesheetTotal = $derived(filteredEntries.reduce((s, e) => s + e.duration, 0));

	function formatTime(ts: import('firebase/firestore').Timestamp): string {
		const d = ts.toDate();
		return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
	}

	function formatHours(seconds: number): string {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		return `${h}:${String(m).padStart(2, '0')}`;
	}

	// CSV export
	function exportCsv() {
		const headers = ['Date', 'Task', 'Project', 'Start', 'End', 'Duration', 'Tags', 'Comment'];
		const rows = filteredEntries.map((e) => [
			e.date,
			taskMap[e.taskId]?.name ?? '',
			projectMap[e.projectId]?.name ?? '',
			e.startTime ? formatTime(e.startTime) : '',
			e.endTime ? formatTime(e.endTime) : '',
			formatDurationShort(e.duration),
			(e.tags || []).join(', '),
			e.comment || ''
		]);

		const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `slicktimer-report-${dateRange.start}-to-${dateRange.end}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	const presets: { value: Preset; label: string }[] = [
		{ value: 'today', label: 'Today' },
		{ value: 'this_week', label: 'This Week' },
		{ value: 'last_week', label: 'Last Week' },
		{ value: 'this_month', label: 'This Month' },
		{ value: 'last_month', label: 'Last Month' },
		{ value: 'custom', label: 'Custom' }
	];
</script>

<svelte:head>
	<title>SlickTimer — Reports</title>
</svelte:head>

<div class="flex h-full flex-col overflow-hidden px-2 py-2">
	<!-- Report type toggle + Export -->
	<div class="flex items-center justify-between pb-2">
		<div class="flex gap-1">
			<button
				onclick={() => (reportType = 'pivot')}
				class="px-2 py-0.5 text-sm {reportType === 'pivot' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}"
			>
				Pivot Table
			</button>
			<button
				onclick={() => (reportType = 'timesheet')}
				class="px-2 py-0.5 text-sm {reportType === 'timesheet' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}"
			>
				Timesheet
			</button>
		</div>
		<button onclick={exportCsv} class="text-sm text-primary hover:underline">Export CSV</button>
	</div>

	<!-- Time frame presets -->
	<div class="flex flex-wrap gap-1 pb-2">
		{#each presets as p}
			<button
				onclick={() => (preset = p.value)}
				class="px-1.5 py-0.5 text-xs {preset === p.value ? 'bg-primary text-white' : 'border border-border text-text-secondary hover:text-text-primary'}"
			>
				{p.label}
			</button>
		{/each}
	</div>

	<!-- Custom date range -->
	{#if preset === 'custom'}
		<div class="flex items-center gap-2 pb-2">
			<input type="date" bind:value={customStart} class="border border-border px-1 py-0.5 text-sm" />
			<span class="text-sm text-text-secondary">to</span>
			<input type="date" bind:value={customEnd} class="border border-border px-1 py-0.5 text-sm" />
		</div>
	{/if}

	<!-- Filters -->
	<div class="flex gap-2 pb-2">
		<select bind:value={filterProject} class="border border-border px-1 py-0.5 text-sm">
			<option value="">All Projects</option>
			{#each projects.data as p}
				<option value={p.id}>{p.name}</option>
			{/each}
		</select>
		<select bind:value={filterTag} class="border border-border px-1 py-0.5 text-sm">
			<option value="">All Tags</option>
			{#each allTags as tag}
				<option value={tag}>#{tag}</option>
			{/each}
		</select>
	</div>

	<!-- Report content -->
	<div class="min-h-0 flex-1 overflow-auto">
		{#if entries.loading}
			<p class="text-sm text-text-secondary">Loading...</p>
		{:else if filteredEntries.length === 0}
			<p class="text-sm text-text-secondary">No entries for this period.</p>
		{:else if reportType === 'pivot'}
			<!-- Pivot table -->
			{@const grid = pivotGrid()}
			<div class="mb-2 flex items-center gap-2">
				<span class="text-xs text-text-secondary">Rows:</span>
				<select bind:value={pivotRows} class="border border-border px-1 py-0.5 text-xs">
					<option value="project">Project</option>
					<option value="task">Task</option>
					<option value="date">Date</option>
				</select>
				<span class="text-xs text-text-secondary">Columns:</span>
				<select bind:value={pivotCols} class="border border-border px-1 py-0.5 text-xs">
					<option value="date">Date</option>
					<option value="project">Project</option>
					<option value="task">Task</option>
				</select>
			</div>
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="px-1 py-0.5 text-left text-xs font-semibold text-text-primary"></th>
						{#each grid.cols as col}
							<th class="px-1 py-0.5 text-right text-xs font-semibold text-text-primary">{col}</th>
						{/each}
						<th class="px-1 py-0.5 text-right text-xs font-semibold text-text-primary">Total</th>
					</tr>
				</thead>
				<tbody>
					{#each grid.rows as row, i}
						<tr class="{i % 2 === 1 ? 'bg-bg-alt' : ''}">
							<td class="px-1 py-0.5 text-xs text-text-primary">{row.name}</td>
							{#each grid.cols as col}
								<td class="px-1 py-0.5 text-right text-xs text-text-secondary font-mono">
									{row.cols[col] ? formatHours(row.cols[col]) : ''}
								</td>
							{/each}
							<td class="px-1 py-0.5 text-right text-xs font-semibold text-text-primary font-mono">{formatHours(row.total)}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr class="border-t border-border">
						<td class="px-1 py-0.5 text-xs font-semibold text-text-primary">Total</td>
						{#each grid.cols as col}
							<td class="px-1 py-0.5 text-right text-xs font-semibold text-text-primary font-mono">{formatHours(grid.colTotals[col])}</td>
						{/each}
						<td class="px-1 py-0.5 text-right text-xs font-semibold text-text-primary font-mono">{formatHours(grid.grandTotal)}</td>
					</tr>
				</tfoot>
			</table>
		{:else}
			<!-- Timesheet -->
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="px-1 py-0.5 text-left text-xs font-semibold text-text-primary">Time</th>
						<th class="px-1 py-0.5 text-left text-xs font-semibold text-text-primary">Task</th>
						<th class="px-1 py-0.5 text-left text-xs font-semibold text-text-primary">Project</th>
						<th class="px-1 py-0.5 text-right text-xs font-semibold text-text-primary">Duration</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredEntries as entry, i}
						<tr class="{i % 2 === 1 ? 'bg-bg-alt' : ''}">
							<td class="px-1 py-0.5 text-xs text-text-secondary font-mono">
								{formatTime(entry.startTime)}–{entry.endTime ? formatTime(entry.endTime) : '...'}
							</td>
							<td class="px-1 py-0.5 text-xs text-text-primary">{taskMap[entry.taskId]?.name ?? 'Unknown'}</td>
							<td class="px-1 py-0.5 text-xs text-text-secondary">{projectMap[entry.projectId]?.name ?? 'Unknown'}</td>
							<td class="px-1 py-0.5 text-right text-xs text-text-primary font-mono">{formatDurationShort(entry.duration)}</td>
						</tr>
						{#if (entry.tags && entry.tags.length > 0) || entry.comment}
							<tr class="{i % 2 === 1 ? 'bg-bg-alt' : ''}">
								<td colspan="4" class="px-1 pb-0.5 text-xs text-text-secondary">
									{#if entry.tags && entry.tags.length > 0}
										{entry.tags.map((t) => `#${t}`).join(' ')}
									{/if}
									{#if entry.comment}
										<span class="italic"> "{entry.comment}"</span>
									{/if}
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
			<div class="border-t border-border pt-1 mt-1">
				<span class="text-sm font-semibold text-text-primary">Total: {formatDurationShort(timesheetTotal)}</span>
			</div>
		{/if}
	</div>
</div>
