<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import SwipeStack from '../../../components/SwipeStack.svelte';
	import type { Room, RoomMovie, Vote } from '$lib/types';

	const code = page.params.code as string;

	let room = $state<Room | null>(null);
	let movies = $state<RoomMovie[]>([]);
	let votedIds = $state<string[]>([]);
	let voteCounts = $state<Record<string, { liked: number; total: number }>>({});
	let memberId = $state('');
	let memberCount = $state(0);
	let loading = $state(true);
	let error = $state('');

	let remainingMovies = $derived(movies.filter((m) => !votedIds.includes(m.id)));
	let currentMovie = $derived(remainingMovies[0] ?? null);
	let allVoted = $derived(!loading && remainingMovies.length === 0);

	let channel: ReturnType<typeof supabase.channel> | null = null;

	onMount(async () => {
		memberId = sessionStorage.getItem('member_id') || '';
		if (!memberId) {
			await goto('/');
			return;
		}

		const { data: roomData } = await supabase
			.from('rooms')
			.select('*')
			.eq('code', code)
			.single();

		if (!roomData) {
			error = 'Room not found';
			loading = false;
			return;
		}
		room = roomData;

		if (roomData.status === 'finished') {
			await goto(`/room/${code}/result`);
			return;
		}

		const { count } = await supabase
			.from('room_members')
			.select('*', { count: 'exact', head: true })
			.eq('room_id', roomData.id);
		memberCount = count || 0;

		const { data: moviesData } = await supabase
			.from('room_movies')
			.select('*')
			.eq('room_id', roomData.id)
			.order('display_order');
		movies = moviesData || [];

		const { data: allVotes } = await supabase
			.from('votes')
			.select('*')
			.eq('room_id', roomData.id);

		if (allVotes) {
			const myVotedIds: string[] = [];
			const counts: Record<string, { liked: number; total: number }> = {};

			for (const v of allVotes) {
				if (v.member_id === memberId) myVotedIds.push(v.movie_id);
				if (!counts[v.movie_id]) counts[v.movie_id] = { liked: 0, total: 0 };
				counts[v.movie_id].total++;
				if (v.liked) counts[v.movie_id].liked++;
			}

			votedIds = myVotedIds;
			voteCounts = counts;
		}

		loading = false;

		channel = supabase
			.channel(`votes-${roomData.id}`)
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'votes', filter: `room_id=eq.${roomData.id}` },
				(payload) => {
					const v = payload.new as Vote;
					const curr = voteCounts[v.movie_id] || { liked: 0, total: 0 };
					voteCounts = {
						...voteCounts,
						[v.movie_id]: {
							liked: curr.liked + (v.liked ? 1 : 0),
							total: curr.total + 1
						}
					};
				}
			)
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'matches', filter: `room_id=eq.${roomData.id}` },
				async () => {
					await goto(`/room/${code}/result`);
				}
			)
			.subscribe();
	});

	onDestroy(() => {
		channel?.unsubscribe();
	});

	async function handleVote(movie: RoomMovie, liked: boolean) {
		if (!room || !memberId) return;

		// Optimistic update
		votedIds = [...votedIds, movie.id];

		const { error: voteErr } = await supabase.from('votes').insert({
			room_id: room.id,
			movie_id: movie.id,
			member_id: memberId,
			liked
		});

		if (voteErr) {
			// Rollback
			votedIds = votedIds.filter((id) => id !== movie.id);
			console.error('Vote failed:', voteErr);
			return;
		}

		// Update local counts
		const curr = voteCounts[movie.id] || { liked: 0, total: 0 };
		const updated = {
			liked: curr.liked + (liked ? 1 : 0),
			total: curr.total + 1
		};
		voteCounts = { ...voteCounts, [movie.id]: updated };

		// Check for majority match
		if (liked && room && updated.liked >= room.majority_threshold) {
			await tryCreateMatch(movie);
		}
	}

	async function tryCreateMatch(movie: RoomMovie) {
		if (!room) return;

		// Guard: check no match exists yet
		const { data: existing } = await supabase
			.from('matches')
			.select('id')
			.eq('room_id', room.id)
			.maybeSingle();

		if (existing) return;

		const { error: matchErr } = await supabase.from('matches').insert({
			room_id: room.id,
			movie_id: movie.id
		});

		if (!matchErr) {
			await supabase.from('rooms').update({ status: 'finished' }).eq('id', room.id);
			await goto(`/room/${code}/result`);
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col">
	<!-- Header bar -->
	<div class="flex items-center justify-between px-5 pt-safe pt-6 pb-3">
		<div class="text-slate-400 text-sm font-mono tracking-wider">{code}</div>
		<div class="text-slate-400 text-sm">{votedIds.length}/{movies.length}</div>
	</div>

	<!-- Main content -->
	<div class="flex-1 flex flex-col items-center justify-center px-4 pb-8">
		{#if loading}
			<div class="text-slate-400 text-lg animate-pulse">Loading movies...</div>
		{:else if error}
			<p class="text-red-400">{error}</p>
		{:else if allVoted}
			<div class="text-center max-w-xs">
				<div class="text-5xl mb-4">😔</div>
				<h2 class="text-white text-2xl font-bold mb-2">No match yet</h2>
				<p class="text-slate-400 text-sm">You've seen all the movies. Waiting for a match from others...</p>
			</div>
		{:else}
			<div class="w-full max-w-sm">
				<p class="text-center text-slate-500 text-xs mb-3 uppercase tracking-wider">
					Swipe to vote
				</p>

				<SwipeStack movies={remainingMovies} onvote={handleVote} />

				<!-- Button controls (tap alternative to swipe) -->
				<div class="flex justify-center gap-10 mt-6">
					<button
						onclick={() => currentMovie && handleVote(currentMovie, false)}
						class="w-14 h-14 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-2xl shadow-lg active:scale-90 transition-transform"
						aria-label="Pass"
					>
						👎
					</button>
					<button
						onclick={() => currentMovie && handleVote(currentMovie, true)}
						class="w-14 h-14 rounded-full bg-violet-600 flex items-center justify-center text-2xl shadow-lg active:scale-90 transition-transform"
						aria-label="Like"
					>
						👍
					</button>
				</div>

				<!-- Vote progress for current movie -->
				{#if currentMovie && voteCounts[currentMovie.id]}
					{@const counts = voteCounts[currentMovie.id]}
					<p class="text-center text-slate-500 text-xs mt-4">
						{counts.liked} like{counts.liked !== 1 ? 's' : ''} · {counts.total}/{memberCount} voted
					</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
