<script lang="ts">
	import type { RoomMovie } from '$lib/types';
	import MovieCard from './MovieCard.svelte';

	let {
		movies,
		onvote
	}: {
		movies: RoomMovie[];
		onvote: (movie: RoomMovie, liked: boolean) => void;
	} = $props();

	let isDragging = $state(false);
	let startX = $state(0);
	let dx = $state(0);
	const THRESHOLD = 80;

	let cardEl = $state<HTMLDivElement | null>(null);

	let rotation = $derived(dx * 0.07);
	let likeOpacity = $derived(dx > 0 ? Math.min(dx / THRESHOLD, 1) : 0);
	let passOpacity = $derived(dx < 0 ? Math.min(-dx / THRESHOLD, 1) : 0);

	function onPointerDown(e: PointerEvent) {
		if (!movies[0] || !cardEl) return;
		isDragging = true;
		startX = e.clientX;
		dx = 0;
		cardEl.setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!isDragging) return;
		dx = e.clientX - startX;
	}

	function onPointerUp() {
		if (!isDragging) return;
		isDragging = false;

		if (Math.abs(dx) > THRESHOLD) {
			const liked = dx > 0;
			const movie = movies[0];
			dx = 0;
			onvote(movie, liked);
		} else {
			dx = 0;
		}
	}
</script>

<!-- Card stack container -->
<div class="relative w-full" style="height: 62vh; min-height: 380px;">
	<!-- Background cards (stacked behind, non-interactive) -->
	{#each movies.slice(1, 3) as movie, i}
		<div
			class="absolute inset-0 pointer-events-none"
			style="
				transform: scale({1 - (i + 1) * 0.04}) translateY({-(i + 1) * 10}px);
				transform-origin: center bottom;
				z-index: {i === 0 ? 2 : 1};
			"
		>
			<MovieCard {movie} />
		</div>
	{/each}

	<!-- Top card (swipeable) -->
	{#if movies[0]}
		<div
			bind:this={cardEl}
			role="button"
			tabindex="0"
			aria-label="Swipe card: drag right to like, left to pass"
			class="absolute inset-0 touch-none"
			style="
				transform: translateX({dx}px) rotate({rotation}deg);
				transition: {isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'};
				transform-origin: center bottom;
				z-index: 10;
				cursor: {isDragging ? 'grabbing' : 'grab'};
			"
			onpointerdown={onPointerDown}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
			onpointercancel={onPointerUp}
		>
			<MovieCard movie={movies[0]} />

			<!-- LIKE overlay -->
			<div
				class="absolute inset-0 rounded-2xl pointer-events-none flex items-center justify-start pl-6 pt-8"
				style="opacity: {likeOpacity}; background: rgba(34,197,94,0.25);"
			>
				<div
					class="border-4 border-green-400 text-green-400 text-3xl font-black rounded-xl px-4 py-2"
					style="transform: rotate(-15deg);"
				>
					LIKE
				</div>
			</div>

			<!-- PASS overlay -->
			<div
				class="absolute inset-0 rounded-2xl pointer-events-none flex items-center justify-end pr-6 pt-8"
				style="opacity: {passOpacity}; background: rgba(239,68,68,0.25);"
			>
				<div
					class="border-4 border-red-400 text-red-400 text-3xl font-black rounded-xl px-4 py-2"
					style="transform: rotate(15deg);"
				>
					PASS
				</div>
			</div>
		</div>
	{/if}
</div>
