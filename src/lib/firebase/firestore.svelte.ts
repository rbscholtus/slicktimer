import {
	onSnapshot,
	doc,
	collection,
	query,
	type DocumentData,
	type Query,
	type DocumentReference
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

export function useCollection<T = DocumentData>(path: string) {
	let data = $state<T[]>([]);
	let loading = $state(true);

	$effect(() => {
		const unsub = onSnapshot(collection(db, path), (snap) => {
			data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
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
