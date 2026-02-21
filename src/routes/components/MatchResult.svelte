<script lang="ts">
	import type { RoomMovie } from '$lib/types';

	let {
		movie,
		onplayagain
	}: {
		movie: RoomMovie;
		onplayagain: () => void;
	} = $props();
</script>

<div class="w-full max-w-sm text-center">
	<!-- Celebration header -->
	<div class="mb-6">
		<div class="text-4xl mb-2">🎉</div>
		<h1 class="text-3xl font-black text-white">It's a Match!</h1>
		<p class="text-slate-400 mt-1">Everyone's watching this tonight</p>
	</div>

	<!-- Movie poster -->
	<div class="relative rounded-2xl overflow-hidden shadow-2xl mb-6 aspect-[2/3] w-48 mx-auto">
		<img src={movie.poster_url} alt={movie.title} class="w-full h-full object-cover" />
	</div>

	<!-- Movie details -->
	<div class="bg-slate-800 rounded-2xl p-5 mb-6 border border-slate-700 text-left shadow-xl">
		<h2 class="text-white text-xl font-bold mb-1">{movie.title}</h2>

		<div class="flex items-center gap-2 mb-3 flex-wrap">
			<span class="text-yellow-400 text-sm font-medium">⭐ {movie.vote_average.toFixed(1)}</span>
			{#each movie.genres.slice(0, 3) as genre}
				<span class="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">{genre}</span>
			{/each}
		</div>

		<p class="text-slate-300 text-sm leading-relaxed">{movie.overview}</p>
	</div>

	<!-- Play again -->
	<button
		onclick={onplayagain}
		class="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold rounded-xl py-3 transition-colors"
	>
		🔄 Play Again
	</button>
</div>
