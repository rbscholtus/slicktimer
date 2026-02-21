import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
	initializeFirestore,
	getFirestore,
	persistentLocalCache,
	persistentMultipleTabManager,
	type Firestore
} from 'firebase/firestore';
import {
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_PROJECT_ID,
	PUBLIC_FIREBASE_STORAGE_BUCKET,
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	PUBLIC_FIREBASE_APP_ID
} from '$env/static/public';

const firebaseConfig = {
	apiKey: PUBLIC_FIREBASE_API_KEY,
	authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: PUBLIC_FIREBASE_APP_ID
};

// Prevent re-initialization during HMR
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// initializeFirestore sets up offline persistence. On HMR it throws because
// Firestore is already initialized — fall back to getFirestore() in that case.
let db: Firestore;
try {
	db = initializeFirestore(app, {
		localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
	});
} catch {
	db = getFirestore(app);
}
export { db };
