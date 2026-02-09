import type { ScheduleEntry } from '../entities/ScheduleEntry';
import type { LocationId } from '../entities/Types';

export interface ScheduleRepository {
	/**
	 * Get schedule entries for a specific location on a given day
	 */
	getSchedule(locationId: LocationId, date: Date): Promise<ScheduleEntry[]>;
}
