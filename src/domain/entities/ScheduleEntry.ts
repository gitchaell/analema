import type { CaptureType } from '../../types';

export interface ScheduleEntry {
	type: CaptureType;
	date: string; // The date of the capture (Bolivia/local time)
	time: string; // The time of the capture (Bolivia/local time)
	phoenixDate: string;
	phoenixTime: string;
	locationId: string;
}
