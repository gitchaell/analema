import * as fs from 'node:fs';
import * as path from 'node:path';
import { DATA_DIR } from '../../config';
import { FIXED_LUNAR_TIME } from '../../config/locations';
import type { ScheduleEntry } from '../../domain/entities/ScheduleEntry';
import type { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import type { CaptureType } from '../../types';
import { Logger } from '../../utils/Logger';

interface RawScheduleEntry {
	'phx.date': string;
	'phx.time': string;
	'bob.date': string;
	'bob.time': string;
}

/**
 * Repository implementation that reads from local JSON files
 */
export class JsonScheduleRepository implements IScheduleRepository {
	private getScheduleFile(
		locationId: string,
		type: CaptureType,
		year: number,
		month: number,
	): string {
		const monthStr = month.toString().padStart(2, '0');
		// For now, Phoenix data is at root of DATA_DIR/type/
		// Future locations could be at DATA_DIR/locationId/type/
		if (locationId === 'phoenix') {
			return path.join(DATA_DIR, type, `${year}-${monthStr}.json`);
		}
		// Fallback for future structure
		return path.join(DATA_DIR, locationId, type, `${year}-${monthStr}.json`);
	}

	private loadTypeSchedule(
		locationId: string,
		type: CaptureType,
		year: number,
		month: number,
	): ScheduleEntry[] {
		const filePath = this.getScheduleFile(locationId, type, year, month);
		const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

		try {
			if (!fs.existsSync(filePath)) {
				Logger.warn(`Schedule file not found: ${filePath}`);
				return [];
			}

			const rawData = fs.readFileSync(filePath, 'utf-8');
			const entries: RawScheduleEntry[] = JSON.parse(rawData);

			Logger.log(`📂 Loaded: data/${type}/${monthStr}.json (${entries.length} entries)`);

			return entries.map((entry) => {
				let time = entry['bob.time'];
				let phoenixTime = entry['phx.time'];

				// Override for Lunar schedule to use Fixed Time
				if (type === 'lunar') {
					time = FIXED_LUNAR_TIME;
					// Calculate phoenix time (approximate, for logging) - assuming 3h offset
					// But we don't strictly need accurate phx time for execution
					const [h, m] = FIXED_LUNAR_TIME.split(':').map(Number);
					const phxH = (h - 3 + 24) % 24;
					phoenixTime = `${phxH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
				}

				return {
					type,
					date: entry['bob.date'],
					time,
					phoenixDate: entry['phx.date'],
					phoenixTime,
					locationId: 'phoenix', // Defaulting to phoenix for now as data structure doesn't support others yet
				};
			});
		} catch (error) {
			Logger.warn(`Could not load data/${type}/${monthStr}.json: ${error}`);
			return [];
		}
	}

	async getSchedule(locationId: string, year: number, month: number): Promise<ScheduleEntry[]> {
		const solarEntries = this.loadTypeSchedule(locationId, 'solar', year, month);
		const lunarEntries = this.loadTypeSchedule(locationId, 'lunar', year, month);

		return [...solarEntries, ...lunarEntries];
	}
}
