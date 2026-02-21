<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import RoomLobby from '../../components/RoomLobby.svelte';
	import type { Room, RoomMember } from '$lib/types';

	const code = page.params.code as string;

	let room = $state<Room | null>(null);
	let members = $state<RoomMember[]>([]);
	let memberId = $state('');
	let isHost = $state(false);
	let loading = $state(true);
	let error = $state('');
	let starting = $state(false);

	let channel: ReturnType<typeof supabase.channel> | null = null;

	onMount(async () => {
		memberId = sessionStorage.getItem('member_id') || '';
		isHost = sessionStorage.getItem('is_host') === 'true';

		if (!memberId) {
			await goto('/');
			return;
		}

		const { data: roomData, error: roomErr } = await supabase
			.from('rooms')
			.select('*')
			.eq('code', code)
			.single();

		if (roomErr || !roomData) {
			error = 'Room not found';
			loading = false;
			return;
		}

		room = roomData;

		if (roomData.status === 'active') {
			await goto(`/room/${code}/vote`);
			return;
		}
		if (roomData.status === 'finished') {
			await goto(`/room/${code}/result`);
			return;
		}

		const { data: membersData } = await supabase
			.from('room_members')
			.select('*')
			.eq('room_id', roomData.id)
			.order('joined_at');

		members = membersData || [];
		loading = false;

		channel = supabase
			.channel(`lobby-${roomData.id}`)
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomData.id}` },
				(payload) => {
					members = [...members, payload.new as RoomMember];
				}
			)
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomData.id}` },
				async (payload) => {
					room = payload.new as Room;
					if (room.status === 'active') {
						await goto(`/room/${code}/vote`);
					}
				}
			)
			.subscribe();
	});

	onDestroy(() => {
		channel?.unsubscribe();
	});

	async function startVoting() {
		if (!room || !isHost) return;
		starting = true;
		const majority_threshold = Math.floor(members.length / 2) + 1;
		const { error: err } = await supabase
			.from('rooms')
			.update({ status: 'active', majority_threshold })
			.eq('id', room.id);
		if (err) {
			error = 'Failed to start voting';
			starting = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
	{#if loading}
		<div class="text-slate-400 text-lg animate-pulse">Loading...</div>
	{:else if error}
		<div class="text-center">
			<p class="text-red-400 mb-4">{error}</p>
			<a href="/" class="text-violet-400 underline">Go home</a>
		</div>
	{:else}
		<RoomLobby {code} {members} {memberId} {isHost} {starting} onstart={startVoting} />
	{/if}
</div>
