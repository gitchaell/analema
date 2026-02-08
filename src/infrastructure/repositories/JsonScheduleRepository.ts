import * as fs from 'node:fs';
import * as path from 'node:path';
import { DATA_DIR } from '../../config';
import type { ScheduleEntry } from '../../domain/entities/ScheduleEntry';
import type { CelestialObject } from '../../domain/entities/Types';
import type { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';
import { Logger } from '../../utils/Logger';

/**
 * Repository implementation that reads from local JSON files
 */
export class JsonScheduleRepository implements ScheduleRepository {
	private getScheduleFile(
		locationId: string,
		object: CelestialObject,
		year: number,
		month: number,
	): string {
		const monthStr = month.toString().padStart(2, '0');
		// Path format: data/{locationId}/{object}/{year}-{month}.json
		return path.join(DATA_DIR, locationId, object, `${year}-${monthStr}.json`);
	}

	private loadObjectSchedule(
		locationId: string,
		object: CelestialObject,
		year: number,
		month: number,
	): ScheduleEntry[] {
		const filePath = this.getScheduleFile(locationId, object, year, month);
		const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

		try {
			if (!fs.existsSync(filePath)) {
				// Quietly return empty if file not found, as we might not have data for all months yet
				return [];
			}

			const rawData = fs.readFileSync(filePath, 'utf-8');
			const entries: ScheduleEntry[] = JSON.parse(rawData);

			Logger.log(
				`📂 Loaded: data/${locationId}/${object}/${monthStr}.json (${entries.length} entries)`,
			);

			return entries;
		} catch (error) {
			Logger.warn(`Could not load data/${locationId}/${object}/${monthStr}.json: ${error}`);
			return [];
		}
	}

	async getSchedule(locationId: string, year: number, month: number): Promise<ScheduleEntry[]> {
		const solarEntries = this.loadObjectSchedule(locationId, 'sun', year, month);
		const lunarEntries = this.loadObjectSchedule(locationId, 'moon', year, month);

		return [...solarEntries, ...lunarEntries];
	}
}
