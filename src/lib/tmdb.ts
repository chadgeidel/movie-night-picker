import { PUBLIC_TMDB_API_KEY } from '$env/static/public';
import type { RoomMovie } from './types';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

const GENRE_MAP: Record<number, string> = {
	28: 'Action',
	12: 'Adventure',
	16: 'Animation',
	35: 'Comedy',
	80: 'Crime',
	99: 'Documentary',
	18: 'Drama',
	10751: 'Family',
	14: 'Fantasy',
	36: 'History',
	27: 'Horror',
	10402: 'Music',
	9648: 'Mystery',
	10749: 'Romance',
	878: 'Sci-Fi',
	10770: 'TV Movie',
	53: 'Thriller',
	10752: 'War',
	37: 'Western'
};

interface TmdbMovie {
	id: number;
	title: string;
	poster_path: string | null;
	overview: string;
	genre_ids: number[];
	vote_average: number;
}

export type MovieInsert = Omit<RoomMovie, 'id' | 'room_id' | 'display_order'>;

export async function fetchMoviePool(count: number): Promise<MovieInsert[]> {
	const pages = Math.ceil(count / 20);
	const movies: TmdbMovie[] = [];

	for (let page = 1; page <= pages; page++) {
		const res = await fetch(
			`${TMDB_BASE}/movie/popular?api_key=${PUBLIC_TMDB_API_KEY}&page=${page}&language=en-US`
		);
		if (!res.ok) throw new Error(`TMDB fetch failed: ${res.status}`);
		const data = await res.json();
		movies.push(...(data.results as TmdbMovie[]));
	}

	return movies
		.slice(0, count)
		.filter((m) => m.poster_path && m.overview)
		.map((m) => ({
			tmdb_id: m.id,
			title: m.title,
			poster_url: `${IMG_BASE}${m.poster_path}`,
			overview: m.overview,
			genres: m.genre_ids.map((id) => GENRE_MAP[id]).filter(Boolean),
			vote_average: Math.round(m.vote_average * 10) / 10
		}));
}
