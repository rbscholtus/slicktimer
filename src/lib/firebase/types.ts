import type { Timestamp } from 'firebase/firestore';

export interface UserSettings {
	pomodoroEnabled: boolean;
	pomodoroDuration: number;
	idleNotification: boolean;
	idleThreshold: number;
}

export interface UserDoc {
	email: string;
	displayName: string;
	photoURL: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
	settings: UserSettings;
}

export interface Project {
	id: string;
	name: string;
	color: string;
	tags: string[];
	order: number;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

export interface Task {
	id: string;
	name: string;
	projectId: string;
	tags: string[];
	status: 'active' | 'completed' | 'archived';
	order: number;
	createdAt: Timestamp;
	updatedAt: Timestamp;
	completedAt: Timestamp | null;
}

export interface TimeEntry {
	id: string;
	taskId: string;
	projectId: string;
	startTime: Timestamp;
	endTime: Timestamp | null;
	duration: number;
	tags: string[];
	comment: string;
	date: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
	userId: string;
}

export interface Share {
	role: 'coworker' | 'reporter';
	sharedBy: string;
	sharedAt: Timestamp;
}

export interface SharedAccess {
	id: string;
	ownerUid: string;
	sharedWithUid: string;
	type: 'project' | 'task';
	refPath: string;
	role: 'coworker' | 'reporter';
	createdAt: Timestamp;
}
