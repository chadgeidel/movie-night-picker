<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import MatchResult from '../../../components/MatchResult.svelte';
	import type { RoomMovie } from '$lib/types';

	const code = page.params.code as string;

	let movie = $state<RoomMovie | null>(null);
	let loading = $state(true);
	let noMatch = $state(false);

	onMount(async () => {
		const { data: room } = await supabase
			.from('rooms')
			.select('*')
			.eq('code', code)
			.single();

		if (!room) {
			await goto('/');
			return;
		}

		const { data: match } = await supabase
			.from('matches')
			.select('*')
			.eq('room_id', room.id)
			.maybeSingle();

		if (!match) {
			noMatch = true;
			loading = false;
			return;
		}

		const { data: movieData } = await supabase
			.from('room_movies')
			.select('*')
			.eq('id', match.movie_id)
			.single();

		movie = movieData;
		loading = false;
	});

	function playAgain() {
		sessionStorage.clear();
		goto('/');
	}
</script>

<div class="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
	{#if loading}
		<div class="text-slate-400 text-lg animate-pulse">Loading result...</div>
	{:else if noMatch || !movie}
		<div class="text-center max-w-sm w-full">
			<div class="text-5xl mb-4">😕</div>
			<h2 class="text-white text-2xl font-bold mb-2">No Match Found</h2>
			<p class="text-slate-400 mb-8">Couldn't find a movie everyone liked. Try again with a new set!</p>
			<button
				onclick={playAgain}
				class="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl py-3 transition-colors"
			>
				🔄 Play Again
			</button>
		</div>
	{:else}
		<MatchResult {movie} onplayagain={playAgain} />
	{/if}
</div>
