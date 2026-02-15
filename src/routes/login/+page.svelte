<script lang="ts">
	import {
		signInWithEmailAndPassword,
		createUserWithEmailAndPassword,
		signInWithPopup,
		GoogleAuthProvider
	} from 'firebase/auth';
	import { auth } from '$lib/firebase/config';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let isSignUp = $state(false);

	async function handleEmailAuth() {
		error = '';
		try {
			if (isSignUp) {
				await createUserWithEmailAndPassword(auth, email, password);
			} else {
				await signInWithEmailAndPassword(auth, email, password);
			}
			goto('/');
		} catch (e: any) {
			error = e.message;
		}
	}

	async function handleGoogleAuth() {
		error = '';
		try {
			await signInWithPopup(auth, new GoogleAuthProvider());
			goto('/');
		} catch (e: any) {
			error = e.message;
		}
	}
</script>

<svelte:head>
	<title>SlickTimer — Login</title>
</svelte:head>

<div class="mx-auto max-w-xs py-8">
	<h1 class="text-lg font-semibold text-text-primary">SlickTimer</h1>
	<p class="mt-1 text-sm text-text-secondary">
		{isSignUp ? 'Create an account' : 'Sign in to continue'}
	</p>

	<form onsubmit={handleEmailAuth} class="mt-4 space-y-2">
		<input
			type="email"
			bind:value={email}
			placeholder="Email"
			required
			class="w-full border border-border px-2 py-1 text-sm focus:outline-primary"
		/>
		<input
			type="password"
			bind:value={password}
			placeholder="Password"
			required
			class="w-full border border-border px-2 py-1 text-sm focus:outline-primary"
		/>
		<button
			type="submit"
			class="w-full bg-primary px-2 py-1 text-sm text-white hover:bg-primary-hover"
		>
			{isSignUp ? 'Sign Up' : 'Sign In'}
		</button>
	</form>

	<button
		onclick={handleGoogleAuth}
		class="mt-2 w-full border border-border px-2 py-1 text-sm text-text-primary hover:bg-bg-alt"
	>
		Continue with Google
	</button>

	<button
		onclick={() => (isSignUp = !isSignUp)}
		class="mt-2 w-full text-sm text-text-secondary hover:text-primary"
	>
		{isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
	</button>

	{#if error}
		<p class="mt-2 text-sm text-timer-stopped">{error}</p>
	{/if}
</div>
