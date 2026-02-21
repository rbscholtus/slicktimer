<script lang="ts">
	import Nav from "$lib/components/Nav.svelte";
	import { getUser } from "$lib/firebase/auth.svelte";

	const user = getUser();

	function openTimer() {
		window.open(
			"/timer",
			"slicktimer",
			"width=300,height=640,resizable=yes",
		);
	}

	const taglines = [
		"No fluff. Just a timer.",
		"Time tracking — distilled.",
		"Minimal timer. Maximum focus.",
		"The anti-bloated timer.",
		"Nothing extra. Everything you need.",
		"Zero effort. All the time.",
		"Time tracking. Without the tracking part.",
		"Effortless by design.",
		"Start in one click. Forget it's there.",
		"Click. Track. Done.",
		"Less tracking. More doing.",
		"Work logged. Brain unloaded.",
		"Focus on work. Not on tracking it.",
		"Slim today. Slick forever.",
		"SlimTimer reborn — even slicker.",
		"Classic simplicity. Modern offline.",
		"The timer you remember. The one you always wanted.",
		"SlimTimer DNA. 2026 polish.",
		"Billable hours, painless.",
		"Precise time. Zero ceremony.",
		"Track without pain. Bill with confidence.",
		"Time tracking without the timesheet",
		"Time tracking for people who hate time tracking.",
		"Make love not timesheets.",
		"Pomodoro? Sure. Drama? Never.",
		"All your timesheets are belong to us.",
		"I track time. So you don't have to.",
		"Works offline. Wins online.",
		"PWA timer. Zero excuses.",
	];

	const tagline = taglines[Math.floor(Math.random() * taglines.length)];
</script>

<svelte:head>
	<title>SlickTimer</title>
</svelte:head>

<!-- Nav bar: adapts to login state -->
{#if user.current}
	<Nav />
{:else}
	<nav class="bg-nav-bar px-2 py-0">
		<div class="flex items-center justify-between">
			<div class="flex items-center">
				<a href="/" class="mr-2 flex items-center gap-1 py-0.5">
					<img src="/favicon-32x32.png" alt="SlickTimer" class="h-5 w-5" />
					<span class="text-sm tracking-wide text-white">SLICK<span class="font-bold">TIMER</span></span>
				</a>
				<span
					class="border-x border-t border-nav-hover bg-nav-active-bg px-1.5 py-0.5 text-sm text-nav-active-text"
				>
					Home
				</span>
			</div>
			<a
				href="/login"
				class="px-1.5 py-0.5 text-sm text-nav-text hover:bg-nav-hover hover:text-primary"
			>
				Login
			</a>
		</div>
	</nav>
{/if}

<div class="mx-auto max-w-2xl px-6 py-10">
	<!-- Logo + tagline + CTA -->
	<div class="flex items-center gap-6">
		<img src="/icon-512.png" alt="SlickTimer" class="h-28 w-28 shrink-0" />
		<div class="flex flex-1 flex-col gap-4">
			<p class="text-3xl font-bold leading-snug" style="color: #ff009a">
				{tagline}
			</p>
			{#if user.current}
				<div>
					<button
						onclick={openTimer}
						class="rounded bg-primary px-5 py-2 text-base font-bold text-white shadow hover:bg-primary-hover"
					>
						Open Timer →
					</button>
				</div>
			{:else}
				<div>
					<a
						href="/login"
						class="inline-block rounded bg-primary px-5 py-2 text-base font-bold text-white shadow hover:bg-primary-hover"
					>
						Get Started →
					</a>
				</div>
			{/if}
		</div>
	</div>

	<!-- Features -->
	<div class="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-text-secondary">
		<div class="flex items-start gap-2">
			<span class="mt-0.5 text-primary">&#9679;</span>
			<span>Organize tasks using <strong class="text-text-primary">Projects</strong>.</span>
		</div>
		<div class="flex items-start gap-2">
			<span class="mt-0.5 text-primary">&#9679;</span>
			<span><strong class="text-text-primary">Offline mode</strong> — works even without a connection.</span>
		</div>
		<div class="flex items-start gap-2">
			<span class="mt-0.5 text-primary">&#9679;</span>
			<span>Built in <strong class="text-text-primary">Pomodoro</strong> mode.</span>
		</div>
		<div class="flex items-start gap-2">
			<span class="mt-0.5 text-primary">&#9679;</span>
			<span>Drag & drop <strong class="text-text-primary">task reordering</strong>.</span>
		</div>
		<div class="flex items-start gap-2">
			<span class="mt-0.5 text-primary">&#9679;</span>
			<span>Flexible pivot-table <strong class="text-text-primary">reports</strong>.</span>
		</div>
		<div class="flex items-start gap-2">
			<span class="mt-0.5 text-primary">&#9679;</span>
			<span><strong class="text-text-primary">Zero-effort</strong> Timesheets.</span>
		</div>
	</div>

	<!-- Getting started -->
	<div class="mt-8">
		<h2 class="text-base font-semibold text-text-primary">Getting Started</h2>
		<ol class="mt-3 space-y-2 text-sm text-text-secondary">
			<li class="flex items-start gap-3">
				<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">1</span>
				<span>Create a <strong class="text-text-primary">Project</strong></span>
			</li>
			<li class="flex items-start gap-3">
				<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">2</span>
				<span>Create a <strong class="text-text-primary">Task</strong></span>
			</li>
			<li class="flex items-start gap-3">
				<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">3</span>
				<span>Click the task to <strong class="text-text-primary">start timing</strong></span>
			</li>
			<li class="flex items-start gap-3">
				<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">4</span>
				<span>Run a <strong class="text-text-primary">Report</strong></span>
			</li>
			<li class="flex items-start gap-3">
				<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">5</span>
				<span><strong class="text-text-primary">Done!</strong> That's literally it.</span>
			</li>
		</ol>
	</div>

</div>
