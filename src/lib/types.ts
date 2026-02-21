export interface Room {
	id: string;
	code: string;
	status: 'waiting' | 'active' | 'finished';
	majority_threshold: number;
	created_at: string;
}

export interface RoomMember {
	id: string;
	room_id: string;
	nickname: string;
	joined_at: string;
}

export interface RoomMovie {
	id: string;
	room_id: string;
	tmdb_id: number;
	title: string;
	poster_url: string;
	overview: string;
	genres: string[];
	vote_average: number;
	display_order: number;
}

export interface Vote {
	id: string;
	room_id: string;
	movie_id: string;
	member_id: string;
	liked: boolean;
	voted_at: string;
}

export interface Match {
	id: string;
	room_id: string;
	movie_id: string;
	matched_at: string;
}
