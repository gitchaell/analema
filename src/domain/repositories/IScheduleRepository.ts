import type { ScheduleEntry } from '../entities/ScheduleEntry';

export interface IScheduleRepository {
	/**
	 * Get schedule entries for a specific location, year and month
	 */
	getSchedule(locationId: string, year: number, month: number): Promise<ScheduleEntry[]>;
}
