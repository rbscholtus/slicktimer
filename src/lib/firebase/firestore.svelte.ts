import {
	onSnapshot,
	doc,
	collection,
	type DocumentData,
	type Query
} from 'firebase/firestore';
import { db } from './config';

export function useDoc<T = DocumentData>(path: string) {
	let data = $state<T | null>(null);
	let loading = $state(true);

	$effect(() => {
		const unsub = onSnapshot(doc(db, path), (snap) => {
			data = snap.exists() ? (snap.data() as T) : null;
			loading = false;
		});
		return unsub;
	});

	return {
		get data() {
			return data;
		},
		get loading() {
			return loading;
		}
	};
}

export function useCollection<T = DocumentData>(getPath: () => string | null) {
	let data = $state<T[]>([]);
	let loading = $state(true);

	$effect(() => {
		const path = getPath();
		if (!path) {
			data = [];
			loading = false;
			return;
		}
		loading = true;
		const unsub = onSnapshot(
			collection(db, path),
			(snap) => {
				data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
				loading = false;
			},
			(err) => {
				console.error('useCollection error:', path, err);
				loading = false;
			}
		);
		return unsub;
	});

	return {
		get data() {
			return data;
		},
		get loading() {
			return loading;
		}
	};
}

export function useQuery<T = DocumentData>(getQuery: () => Query | null) {
	let data = $state<T[]>([]);
	let loading = $state(true);

	$effect(() => {
		const q = getQuery();
		if (!q) {
			data = [];
			loading = false;
			return;
		}
		loading = true;
		const unsub = onSnapshot(
			q,
			(snap) => {
				data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
				loading = false;
			},
			(err) => {
				console.error('useQuery error:', err);
				loading = false;
			}
		);
		return unsub;
	});

	return {
		get data() {
			return data;
		},
		get loading() {
			return loading;
		}
	};
}
