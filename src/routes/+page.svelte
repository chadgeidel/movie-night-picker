<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { fetchMoviePool } from '$lib/tmdb';

	let nickname = $state('');
	let roomCode = $state('');
	let view = $state<'home' | 'join'>('home');
	let loading = $state(false);
	let error = $state('');

	function generateCode(): string {
		// Avoid ambiguous characters (0/O, 1/I/L)
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
	}

	async function createRoom() {
		if (!nickname.trim()) {
			error = 'Please enter your name';
			return;
		}
		loading = true;
		error = '';

		try {
			const code = generateCode();

			const { data: room, error: roomErr } = await supabase
				.from('rooms')
				.insert({ code, status: 'waiting', majority_threshold: 1 })
				.select()
				.single();

			if (roomErr) throw roomErr;

			const { data: member, error: memberErr } = await supabase
				.from('room_members')
				.insert({ room_id: room.id, nickname: nickname.trim() })
				.select()
				.single();

			if (memberErr) throw memberErr;

			const movies = await fetchMoviePool(25);
			const { error: moviesErr } = await supabase.from('room_movies').insert(
				movies.map((m, i) => ({ ...m, room_id: room.id, display_order: i }))
			);
			if (moviesErr) throw moviesErr;

			sessionStorage.setItem('member_id', member.id);
			sessionStorage.setItem('room_id', room.id);
			sessionStorage.setItem('is_host', 'true');

			await goto(`/room/${code}`);
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Failed to create room';
		} finally {
			loading = false;
		}
	}

	async function joinRoom() {
		if (!nickname.trim()) {
			error = 'Please enter your name';
			return;
		}
		if (!roomCode.trim()) {
			error = 'Please enter a room code';
			return;
		}
		loading = true;
		error = '';

		try {
			const code = roomCode.trim().toUpperCase();

			const { data: room, error: roomErr } = await supabase
				.from('rooms')
				.select('*')
				.eq('code', code)
				.single();

			if (roomErr || !room) throw new Error('Room not found. Check the code and try again.');
			if (room.status !== 'waiting')
				throw new Error('This room has already started. Ask the host to create a new room.');

			const { data: member, error: memberErr } = await supabase
				.from('room_members')
				.insert({ room_id: room.id, nickname: nickname.trim() })
				.select()
				.single();

			if (memberErr) throw memberErr;

			sessionStorage.setItem('member_id', member.id);
			sessionStorage.setItem('room_id', room.id);
			sessionStorage.setItem('is_host', 'false');

			await goto(`/room/${code}`);
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Failed to join room';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
	<div class="w-full max-w-sm">
		<!-- Header -->
		<div class="text-center mb-10">
			<div class="text-6xl mb-3">🎬</div>
			<h1 class="text-3xl font-bold text-white">Movie Night</h1>
			<p class="text-slate-400 mt-1">Swipe to find your next watch</p>
		</div>

		<!-- Form card -->
		<div class="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
			<div class="mb-4">
				<label for="nickname" class="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
				<input
					id="nickname"
					type="text"
					bind:value={nickname}
					placeholder="Enter your name"
					maxlength={20}
					autocomplete="off"
					class="w-full bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
				/>
			</div>

			{#if view === 'join'}
				<div class="mb-4">
					<label for="code" class="block text-sm font-medium text-slate-300 mb-2">Room Code</label>
					<input
						id="code"
						type="text"
						bind:value={roomCode}
						placeholder="XXXX"
						maxlength={4}
						autocomplete="off"
						oninput={() => (roomCode = roomCode.toUpperCase())}
						class="w-full bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 uppercase tracking-[0.3em] text-lg font-bold text-center transition-shadow"
					/>
				</div>
			{/if}

			{#if error}
				<p class="text-red-400 text-sm mb-4 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
			{/if}

			{#if view === 'home'}
				<button
					onclick={createRoom}
					disabled={loading}
					class="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 mb-3 transition-colors"
				>
					{loading ? 'Creating room...' : '✨ Create Room'}
				</button>
				<button
					onclick={() => {
						view = 'join';
						error = '';
					}}
					class="w-full bg-slate-700 hover:bg-slate-600 active:bg-slate-600 text-white font-semibold rounded-xl py-3 transition-colors"
				>
					🔗 Join Room
				</button>
			{:else}
				<button
					onclick={joinRoom}
					disabled={loading}
					class="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 mb-3 transition-colors"
				>
					{loading ? 'Joining...' : '🚀 Join Room'}
				</button>
				<button
					onclick={() => {
						view = 'home';
						error = '';
					}}
					class="w-full bg-slate-700 hover:bg-slate-600 active:bg-slate-600 text-white font-semibold rounded-xl py-3 transition-colors"
				>
					← Back
				</button>
			{/if}
		</div>

		<p class="text-center text-slate-500 text-sm mt-6">2–5 players · Swipe right to like · Find your match</p>
	</div>
</div>
