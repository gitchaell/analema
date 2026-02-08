import { ScheduleEntry } from '../entities/ScheduleEntry';

export interface ScheduleRepository {
	/**
	 * Get schedule entries for a specific location on a given day
	 */
	getSchedule(
		locationId: string,
		date: Date,
	): Promise<ScheduleEntry[]>;
}
