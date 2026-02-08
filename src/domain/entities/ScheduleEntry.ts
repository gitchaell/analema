import type { CelestialObject } from './Types';

export interface ScheduleEntry {
	object: CelestialObject;
	date: string; // The date of the capture (System/Bolivia time)
	time: string; // The time of the capture (System/Bolivia time)
	targetDate?: string; // The date of the capture (Location time)
	targetTime?: string; // The time of the capture (Location time)
	locationId: string;
}
