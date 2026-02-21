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

	// Format a Date as YYYY-MM-DD using local timezone (NOT UTC)
	function toDateString(d: Date): string {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	function getDateRange(p: Preset): { start: string; end: string } {
		const now = new Date();
		const today = todayDateString();

		if (p === 'today') return { start: today, end: today };

		if (p === 'this_week') {
			const d = new Date(now);
			const day = d.getDay();
			const diff = day === 0 ? 6 : day - 1; // Monday start
			d.setDate(d.getDate() - diff);
			const start = toDateString(d);
			// End on Sunday of this week (Mon + 6) to include weekend data if it exists
			d.setDate(d.getDate() + 6);
			const end = toDateString(d);
			return { start, end };
		}

		if (p === 'last_week') {
			const d = new Date(now);
			const day = d.getDay();
			const diff = day === 0 ? 6 : day - 1;
			d.setDate(d.getDate() - diff - 7);
			const start = toDateString(d);
			// End on Sunday of last week (Mon + 6) to include weekend data if it exists
			d.setDate(d.getDate() + 6);
			const end = toDateString(d);
			return { start, end };
		}

		if (p === 'this_month') {
			const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
			return { start, end: today };
		}

		if (p === 'last_month') {
			const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			const start = toDateString(d);
			const dEnd = new Date(now.getFullYear(), now.getMonth(), 0);
			const end = toDateString(dEnd);
			return { start, end };
		}

		// custom
		return { start: customStart || today, end: customEnd || today };
	}

	const dateRange = $derived(getDateRange(preset));

	// Load projects and tasks
	const projects = useCollection<Project>(() => uid ? `users/${uid}/projects` : null);
	const tasks = useCollection<Task>(() => uid ? `users/${uid}/tasks` : null);

	// Query entries for date range
	const entries = useQuery<TimeEntry>(() =>
		uid
			? query(
					collection(db, `users/${uid}/timeEntries`),
					where('date', '>=', dateRange.start),
					where('date', '<=', dateRange.end),
					orderBy('startTime', 'asc')
				)
			: null
	);

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

	// Display options
	let showColumnTotal = $state(true);
	let showRowTotal = $state(true);

	// Pivot table state
	type PivotAxis = 'project' | 'task' | 'date' | 'entry';
	type GroupByField = 'none' | 'project' | 'task' | 'date' | 'tags';
	// Defaults match "Today" preset
	let groupBy = $state<GroupByField>('none');
	let pivotRows = $state<PivotAxis>('entry');
	let pivotCols = $state<PivotAxis>('project');

	// Expand/collapse state for grouped pivot
	let expandedGroups = $state<Set<string>>(new Set());

	// Set smart defaults when preset changes
	$effect(() => {
		if (preset === 'today') {
			groupBy = 'none';
			pivotRows = 'entry';
			pivotCols = 'project';
		} else {
			groupBy = 'project';
			pivotRows = 'task';
			pivotCols = 'date';
		}
	});

	// Conflict validation: prevent same field in Group By + Rows + Columns
	$effect(() => {
		// If groupBy conflicts with pivotRows, reset pivotRows
		if (groupBy !== 'none' && groupBy === pivotRows) {
			pivotRows = pivotRows === 'task' ? 'project' : 'task';
		}
		// If groupBy conflicts with pivotCols, reset pivotCols
		if (groupBy !== 'none' && groupBy === pivotCols) {
			pivotCols = pivotCols === 'date' ? 'task' : 'date';
		}
		// If pivotRows === pivotCols, reset pivotCols
		if (pivotRows === pivotCols) {
			pivotCols = pivotRows === 'date' ? 'task' : 'date';
		}
	});

	// Reset expandedGroups when groupBy changes (expand all by default)
	$effect(() => {
		if (groupBy !== 'none' && filteredEntries.length > 0) {
			const grid = groupedPivotGrid();
			expandedGroups = new Set(grid.groups.map((g) => g.name));
		} else if (groupBy === 'none') {
			expandedGroups = new Set();
		}
	});

	function toggleGroup(groupName: string) {
		const newSet = new Set(expandedGroups);
		if (newSet.has(groupName)) {
			newSet.delete(groupName);
		} else {
			newSet.add(groupName);
		}
		expandedGroups = newSet;
	}

	function getAxisValue(entry: TimeEntry, axis: PivotAxis): string {
		if (axis === 'project') return projectMap[entry.projectId]?.name ?? 'Unknown';
		if (axis === 'task') return taskMap[entry.taskId]?.name ?? 'Unknown';
		if (axis === 'date') return entry.date;
		if (axis === 'entry') {
			const taskName = taskMap[entry.taskId]?.name ?? 'Unknown';
			return `${formatTime(entry.startTime)} - ${taskName}`;
		}
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

		// Determine columns: use weekday logic for date columns + week presets
		let sortedCols: string[];
		if (pivotCols === 'date' && (preset === 'this_week' || preset === 'last_week')) {
			sortedCols = getWeekdayColumns(dateRange.start, dateRange.end);
		} else {
			sortedCols = [...colKeys].sort();
		}

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

	function formatDateHeader(dateStr: string): string {
		const d = new Date(dateStr + 'T00:00:00');
		const today = new Date();
		const showYear = d.getFullYear() !== today.getFullYear();
		return d.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: showYear ? 'numeric' : undefined
		});
	}

	// Generate weekday columns for This Week / Last Week
	// Always includes Mon-Fri; includes Sat/Sun only if there's data on those days
	function getWeekdayColumns(start: string, end: string): string[] {
		const cols: string[] = [];

		// Check if there's any Saturday or Sunday data in the date range
		const hasSaturdayData = filteredEntries.some((e) => {
			const d = new Date(e.date + 'T00:00:00');
			return d.getDay() === 6;
		});
		const hasSundayData = filteredEntries.some((e) => {
			const d = new Date(e.date + 'T00:00:00');
			return d.getDay() === 0;
		});

		// Iterate from start to end, include Mon-Fri always, Sat/Sun only with data
		const current = new Date(start + 'T00:00:00');
		const endDate = new Date(end + 'T00:00:00');

		while (current <= endDate) {
			const day = current.getDay();
			if (day >= 1 && day <= 5) {
				cols.push(toDateString(current));
			} else if (day === 6 && hasSaturdayData) {
				cols.push(toDateString(current));
			} else if (day === 0 && hasSundayData) {
				cols.push(toDateString(current));
			}
			current.setDate(current.getDate() + 1);
		}

		return cols;
	}

	// Get group key for an entry
	function getGroupValue(entry: TimeEntry, groupField: GroupByField): string[] {
		if (groupField === 'none') return [''];
		if (groupField === 'project') return [projectMap[entry.projectId]?.name ?? 'Unknown'];
		if (groupField === 'task') return [taskMap[entry.taskId]?.name ?? 'Unknown'];
		if (groupField === 'date') return [entry.date];
		if (groupField === 'tags') {
			return entry.tags && entry.tags.length > 0 ? entry.tags : ['(No Tags)'];
		}
		return [''];
	}

	// Compute grouped pivot table
	type GroupedPivotTable = {
		groups: Array<{
			name: string;
			rows: Array<{ name: string; cols: Record<string, number>; total: number }>;
			cols: Record<string, number>;
			total: number;
		}>;
		cols: string[];
		colTotals: Record<string, number>;
		grandTotal: number;
	};

	const groupedPivotGrid = $derived((): GroupedPivotTable => {
		if (groupBy === 'none') {
			// Return empty structure
			return { groups: [], cols: [], colTotals: {}, grandTotal: 0 };
		}

		// Build: groupKey → rowKey → colKey → seconds
		const groupData: Record<string, Record<string, Record<string, number>>> = {};
		const colKeys = new Set<string>();

		for (const entry of filteredEntries) {
			const groupKeys = getGroupValue(entry, groupBy);
			const rowKey = getAxisValue(entry, pivotRows);
			const colKey = getAxisValue(entry, pivotCols);
			colKeys.add(colKey);

			for (const groupKey of groupKeys) {
				if (!groupData[groupKey]) groupData[groupKey] = {};
				if (!groupData[groupKey][rowKey]) groupData[groupKey][rowKey] = {};
				groupData[groupKey][rowKey][colKey] = (groupData[groupKey][rowKey][colKey] || 0) + entry.duration;
			}
		}

		// Determine columns
		let sortedCols: string[];
		if (pivotCols === 'date' && (preset === 'this_week' || preset === 'last_week')) {
			sortedCols = getWeekdayColumns(dateRange.start, dateRange.end);
		} else {
			sortedCols = [...colKeys].sort();
		}

		// Build groups
		const groups = Object.keys(groupData).sort().map((groupName) => {
			const rowData = groupData[groupName];
			const rows = Object.entries(rowData).sort(([a], [b]) => a.localeCompare(b)).map(([name, cols]) => {
				const total = Object.values(cols).reduce((s, v) => s + v, 0);
				return { name, cols, total };
			});

			// Group subtotals per column
			const groupCols: Record<string, number> = {};
			let groupTotal = 0;
			for (const col of sortedCols) {
				groupCols[col] = rows.reduce((s, r) => s + (r.cols[col] || 0), 0);
				groupTotal += groupCols[col];
			}

			return { name: groupName, rows, cols: groupCols, total: groupTotal };
		});

		// Column totals and grand total
		const colTotals: Record<string, number> = {};
		let grandTotal = 0;
		for (const col of sortedCols) {
			colTotals[col] = groups.reduce((s, g) => s + (g.cols[col] || 0), 0);
			grandTotal += colTotals[col];
		}

		return { groups, cols: sortedCols, colTotals, grandTotal };
	});

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
	<title>SlickTimer — Run Reports</title>
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
	<div class="flex items-center gap-2 pb-2">
		<span class="text-sm font-medium text-text-primary">Time range:</span>
		<div class="flex flex-wrap gap-1">
			{#each presets as p}
				<button
					onclick={() => (preset = p.value)}
					class="px-1.5 py-0.5 text-xs {preset === p.value ? 'bg-primary text-white' : 'border border-border text-text-secondary hover:text-text-primary'}"
				>
					{p.label}
				</button>
			{/each}
		</div>
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
	<div class="flex items-center gap-2 pb-2">
		<span class="text-sm font-medium text-text-primary">Filters:</span>
		<select bind:value={filterProject} class="border border-border px-2 py-1 text-sm min-w-[160px]">
			<option value="">All Projects</option>
			{#each projects.data as p}
				<option value={p.id}>{p.name}</option>
			{/each}
		</select>
		<select bind:value={filterTag} class="border border-border px-2 py-1 text-sm min-w-[160px]">
			<option value="">All Tags</option>
			{#each allTags as tag}
				<option value={tag}>#{tag}</option>
			{/each}
		</select>
	</div>

	<!-- Display options (only show when there's data) -->
	{#if filteredEntries.length > 0}
		<div class="flex items-center gap-3 pb-2">
			<span class="text-sm font-medium text-text-primary">Show:</span>
			<label class="flex items-center gap-1 text-sm">
				<input type="checkbox" bind:checked={showRowTotal} />
				Row Total
			</label>
			<label class="flex items-center gap-1 text-sm">
				<input type="checkbox" bind:checked={showColumnTotal} />
				Column Total
			</label>
		</div>
	{/if}

	<!-- Report content -->
	<div class="min-h-0 flex-1 overflow-auto">
		{#if entries.loading}
			<p class="text-sm text-text-secondary">Loading...</p>
		{:else if filteredEntries.length === 0}
			<p class="text-sm text-text-secondary">No time entries for this period.</p>
		{:else if reportType === 'pivot'}
			<!-- Pivot table -->
			{@const grid = pivotGrid()}
			<div class="mb-2 flex items-center gap-2">
				<span class="text-sm font-medium text-text-primary">Group By:</span>
				<select bind:value={groupBy} class="border border-border px-2 py-1 text-sm min-w-[120px]">
					<option value="none">None</option>
					<option value="project">Project</option>
					<option value="task">Task</option>
					<option value="date">Date</option>
					<option value="tags">Tags</option>
				</select>
				<span class="text-sm font-medium text-text-primary">Rows:</span>
				<select bind:value={pivotRows} class="border border-border px-2 py-1 text-sm min-w-[120px]">
					<option value="project">Project</option>
					<option value="task">Task</option>
					<option value="date">Date</option>
					<option value="entry">Time Entry</option>
				</select>
				<span class="text-sm font-medium text-text-primary">Columns:</span>
				<select bind:value={pivotCols} class="border border-border px-2 py-1 text-sm min-w-[120px]">
					<option value="date">Date</option>
					<option value="project">Project</option>
					<option value="task">Task</option>
				</select>
			</div>
			{#if groupBy === 'none'}
				<!-- Flat pivot table -->
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border">
							<th class="px-2 py-1 text-left text-xs font-semibold text-text-primary"></th>
							{#each grid.cols as col}
								<th class="px-2 py-1 text-right text-xs font-semibold text-text-primary">
									{pivotCols === 'date' ? formatDateHeader(col) : col}
								</th>
							{/each}
							{#if showRowTotal}
								<th class="px-2 py-1 text-right text-xs font-semibold text-text-primary">Total</th>
							{/if}
						</tr>
					</thead>
					<tbody>
						{#each grid.rows as row, i}
							<tr class="{i % 2 === 1 ? 'bg-bg-alt' : ''}">
								<td class="px-2 py-1 text-xs text-text-primary">{row.name}</td>
								{#each grid.cols as col}
									<td class="px-2 py-1 text-right text-xs text-text-secondary font-mono">
										{row.cols[col] ? formatHours(row.cols[col]) : ''}
									</td>
								{/each}
								{#if showRowTotal}
									<td class="px-2 py-1 text-right text-xs font-semibold text-text-primary font-mono">{formatHours(row.total)}</td>
								{/if}
							</tr>
						{/each}
					</tbody>
					{#if showColumnTotal}
						<tfoot>
							<tr class="border-t border-border">
								<td class="px-2 py-1 text-xs font-semibold text-text-primary">Total</td>
								{#each grid.cols as col}
									<td class="px-2 py-1 text-right text-xs font-semibold text-text-primary font-mono">{formatHours(grid.colTotals[col])}</td>
								{/each}
								{#if showRowTotal}
									<td class="px-2 py-1 text-right text-xs font-semibold text-text-primary font-mono">{formatHours(grid.grandTotal)}</td>
								{/if}
							</tr>
						</tfoot>
					{/if}
				</table>
			{:else}
				<!-- Grouped pivot table -->
				{@const groupedGrid = groupedPivotGrid()}
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border">
							<th class="px-2 py-1 text-left text-xs font-semibold text-text-primary"></th>
							{#each groupedGrid.cols as col}
								<th class="px-2 py-1 text-right text-xs font-semibold text-text-primary">
									{pivotCols === 'date' ? formatDateHeader(col) : col}
								</th>
							{/each}
							{#if showRowTotal}
								<th class="px-2 py-1 text-right text-xs font-semibold text-text-primary">Total</th>
							{/if}
						</tr>
					</thead>
					<tbody>
						{#each groupedGrid.groups as group}
							<!-- Group header row -->
							<tr
								class="cursor-pointer border-b border-border bg-bg-alt font-semibold hover:bg-primary/10"
								onclick={() => toggleGroup(group.name)}
							>
								<td class="px-2 py-1 text-xs">
									<span class="inline-block w-4">{expandedGroups.has(group.name) ? '▼' : '▶'}</span>
									{group.name}
								</td>
								{#each groupedGrid.cols as col}
									<td class="px-2 py-1 text-right text-xs font-mono italic">{group.cols[col] ? formatHours(group.cols[col]) : ''}</td>
								{/each}
								{#if showRowTotal}
									<td class="px-2 py-1 text-right text-xs font-mono italic">{formatHours(group.total)}</td>
								{/if}
							</tr>

							<!-- Row details (only if expanded) -->
							{#if expandedGroups.has(group.name)}
								{#each group.rows as row, i}
									<tr class="{i % 2 === 1 ? 'bg-bg-alt' : ''}">
										<td class="px-2 py-1 pl-8 text-xs text-text-primary">{row.name}</td>
										{#each groupedGrid.cols as col}
											<td class="px-2 py-1 text-right text-xs text-text-secondary font-mono">
												{row.cols[col] ? formatHours(row.cols[col]) : ''}
											</td>
										{/each}
										{#if showRowTotal}
											<td class="px-2 py-1 text-right text-xs font-semibold text-text-primary font-mono">{formatHours(row.total)}</td>
										{/if}
									</tr>
								{/each}
							{/if}
						{/each}
					</tbody>
					{#if showColumnTotal}
						<tfoot>
							<tr class="border-t-2 border-border font-semibold">
								<td class="px-2 py-1 text-xs text-text-primary">Total</td>
								{#each groupedGrid.cols as col}
									<td class="px-2 py-1 text-right text-xs text-text-primary font-mono">{formatHours(groupedGrid.colTotals[col] || 0)}</td>
								{/each}
								{#if showRowTotal}
									<td class="px-2 py-1 text-right text-xs text-text-primary font-mono">{formatHours(groupedGrid.grandTotal)}</td>
								{/if}
							</tr>
						</tfoot>
					{/if}
				</table>
			{/if}
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
