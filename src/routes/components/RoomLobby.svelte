<script lang="ts">
	import type { RoomMember } from '$lib/types';

	let {
		code,
		members,
		memberId,
		isHost,
		starting,
		onstart
	}: {
		code: string;
		members: RoomMember[];
		memberId: string;
		isHost: boolean;
		starting: boolean;
		onstart: () => void;
	} = $props();
</script>

<div class="w-full max-w-sm">
	<!-- Room code display -->
	<div class="text-center mb-8">
		<p class="text-slate-400 text-xs uppercase tracking-widest mb-2">Room Code</p>
		<div class="text-5xl font-black text-white tracking-[0.25em] font-mono">{code}</div>
		<p class="text-slate-500 text-sm mt-2">Share this code with friends</p>
	</div>

	<!-- Members list -->
	<div class="bg-slate-800 rounded-2xl p-5 mb-5 border border-slate-700 shadow-xl">
		<h2 class="text-slate-400 text-xs uppercase tracking-wider mb-4 font-medium">
			{members.length} {members.length === 1 ? 'person' : 'people'} joined
		</h2>
		<ul class="space-y-3">
			{#each members as member}
				<li class="flex items-center gap-3">
					<div
						class="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0"
					>
						{member.nickname[0].toUpperCase()}
					</div>
					<span class="text-white font-medium">{member.nickname}</span>
					{#if member.id === memberId}
						<span class="text-xs text-slate-500 ml-auto">(you)</span>
					{/if}
				</li>
			{/each}
		</ul>
	</div>

	<!-- Action area -->
	{#if isHost}
		<button
			onclick={onstart}
			disabled={starting}
			class="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-4 text-lg transition-colors shadow-lg"
		>
			{starting ? 'Starting...' : '🍿 Start Voting'}
		</button>
		<p class="text-center text-slate-500 text-sm mt-3">
			Add more friends, then start when ready
		</p>
	{:else}
		<div class="text-center py-4">
			<div class="inline-flex items-center gap-2 text-slate-400">
				<span class="inline-block w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
				Waiting for host to start...
			</div>
			<p class="text-slate-500 text-sm mt-2">The host will start voting when everyone's ready</p>
		</div>
	{/if}
</div>
