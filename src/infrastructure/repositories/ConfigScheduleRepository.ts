import { TIMEZONE } from '../../config';
import { LOCATIONS } from '../../config/locations';
import { Location } from '../../domain/entities/Location';
import { ScheduleEntry } from '../../domain/entities/ScheduleEntry';
import { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';

export class ConfigScheduleRepository implements ScheduleRepository {
	/**
	 * Get schedule entries for a specific location on a given day
	 * Logic is purely configuration-based (Sun at 15:30, Moon at 20:00 - local time)
	 * Returns times converted to System Time (Bolivia)
	 */
	async getSchedule(locationId: string, date: Date): Promise<ScheduleEntry[]> {
		const location = LOCATIONS.find((l) => l.id === locationId);
		if (!location) {
			return [];
		}

		// Calculate System Times for Sun and Moon
		// 1. Sun
		const sunEntry = this.createEntry(location, 'sun', date);
		// 2. Moon
		const moonEntry = this.createEntry(location, 'moon', date);

		return [sunEntry, moonEntry];
	}

	private createEntry(
		location: Location,
		object: 'sun' | 'moon',
		targetDate: Date,
	): ScheduleEntry {
		// Target Time (Local Location Time)
		const targetTimeStr =
			object === 'sun' ? location.sunCaptureTime : location.moonCaptureTime;

		// Convert to System Time (Bolivia)
		const systemDateTime = this.calculateSystemDateTime(
			targetDate,
			targetTimeStr,
			location,
		);

		return {
			object,
			locationId: location.id,
			date: systemDateTime.date, // System Date
			time: systemDateTime.time, // System Time
			targetDate: this.formatDate(targetDate), // Location Date (Assuming same day for simplicity)
			targetTime: targetTimeStr, // Location Time
		};
	}

	/**
	 * Calculate the System Date/Time (Bolivia) for a given Target Date/Time (Location)
	 */
	private calculateSystemDateTime(
		dateForDay: Date,
		targetTimeStr: string,
		location: Location,
	): { date: string; time: string } {
		// Parse offset strings like "UTC-7"
		const locationOffset = parseInt(location.offset.replace('UTC', ''));
		const systemOffset = parseInt(TIMEZONE.boliviaOffset.replace('UTC', ''));

		// Calculate difference: System - Location
		// e.g. (-4) - (-7) = +3 hours.
		const diffHours = systemOffset - locationOffset;

		const [hour, minute] = targetTimeStr.split(':').map(Number);

		// Create Date object assuming UTC (to simplify calculation)
		const date = new Date(
			Date.UTC(
				dateForDay.getFullYear(),
				dateForDay.getMonth(),
				dateForDay.getDate(),
				hour,
				minute,
			),
		);

		// Add the difference in hours
		date.setUTCHours(date.getUTCHours() + diffHours);

		// Extract components
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
