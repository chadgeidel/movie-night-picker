<script lang="ts">
	import type { RoomMovie } from '$lib/types';

	let { movie }: { movie: RoomMovie } = $props();
</script>

<div class="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full h-full relative select-none">
	<img
		src={movie.poster_url}
		alt={movie.title}
		class="absolute inset-0 w-full h-full object-cover"
		draggable="false"
	/>
	<!-- Gradient overlay -->
	<div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent"></div>

	<!-- Movie info -->
	<div class="absolute bottom-0 left-0 right-0 p-5">
		<h2 class="text-white text-xl font-bold leading-tight mb-2">{movie.title}</h2>
		<div class="flex items-center gap-2 mb-2 flex-wrap">
			<span class="text-yellow-400 text-sm font-medium">⭐ {movie.vote_average.toFixed(1)}</span>
			{#each movie.genres.slice(0, 2) as genre}
				<span class="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
					{genre}
				</span>
			{/each}
		</div>
		<p class="text-white/75 text-sm leading-relaxed line-clamp-3">{movie.overview}</p>
	</div>
</div>
