import { TIMEZONE } from '../../config';
import { LOCATIONS } from '../../config/locations';
import type { Location } from '../../domain/entities/Location';
import type { ScheduleEntry } from '../../domain/entities/ScheduleEntry';
import type { LocationId } from '../../domain/entities/Types';
import type { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';

export class ConfigScheduleRepository implements ScheduleRepository {
	/**
	 * Get schedule entries for a specific location on a given day
	 * Logic is purely configuration-based (Sun at 15:30, Moon at 20:00 - local time)
	 * Returns times converted to System Time (Bolivia)
	 */
	async getSchedule(locationId: LocationId, date: Date): Promise<ScheduleEntry[]> {
		const location = LOCATIONS.find((location) => location.id === locationId);

		if (!location) return [];

		const sunEntry = this.createEntry(location, 'sun', date);
		const moonEntry = this.createEntry(location, 'moon', date);

		return [sunEntry, moonEntry];
	}

	private createEntry(location: Location, object: 'sun' | 'moon', targetDate: Date): ScheduleEntry {
		const targetTimeStr = object === 'sun' ? location.sunCaptureTime : location.moonCaptureTime;

		const systemDateTime = this.calculateSystemDateTime(targetDate, targetTimeStr, location);

		return {
			object,
			location,
			date: systemDateTime.date,
			time: systemDateTime.time,
			targetDate: this.formatDate(targetDate),
			targetTime: targetTimeStr,
		};
	}

	private calculateSystemDateTime(
		dateForDay: Date,
		targetTimeStr: string,
		location: Location,
	): { date: string; time: string } {
		const locationOffset = parseInt(location.offset.replace('UTC', ''), 10);
		const systemOffset = parseInt(TIMEZONE.boliviaOffset.replace('UTC', ''), 10);

		const diffHours = systemOffset - locationOffset;

		const [hour, minute] = targetTimeStr.split(':').map(Number);
		const date = new Date(
			Date.UTC(dateForDay.getFullYear(), dateForDay.getMonth(), dateForDay.getDate(), hour, minute),
		);

		date.setUTCHours(date.getUTCHours() + diffHours);

		const sysYear = date.getUTCFullYear();
		const sysMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
		const sysDay = String(date.getUTCDate()).padStart(2, '0');
		const sysHour = String(date.getUTCHours()).padStart(2, '0');
		const sysMinute = String(date.getUTCMinutes()).padStart(2, '0');

		return {
			date: `${sysYear}-${sysMonth}-${sysDay}`,
			time: `${sysHour}:${sysMinute}`,
		};
	}

	private formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}
}
