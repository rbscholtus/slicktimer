import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './config';

let user = $state<User | null>(null);
let loading = $state(true);

onAuthStateChanged(auth, (u) => {
	user = u;
	loading = false;
});

export function getUser() {
	return {
		get current() {
			return user;
		},
		get loading() {
			return loading;
		}
	};
}
