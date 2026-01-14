/**
 * =============================================================================
 * ANALEMA SOLAR Y LUNAR - Schedule Service
 * =============================================================================
 */

import * as fs from 'node:fs';
import { getCurrentYearMonth, getScheduleFile } from '../config';
import type { CombinedEntry, ScheduledCapture, ScheduleEntry } from '../types';
import { Logger } from '../utils/Logger';

/**
 * Service for loading and querying capture schedules
 */
export class ScheduleService {
	private currentYear: number;
	private currentMonth: number;

	constructor() {
		const { year, month } = getCurrentYearMonth();
		this.currentYear = year;
		this.currentMonth = month;
	}

	/**
	 * Load a schedule file from disk and transform to CombinedEntry format
	 */
	private loadSchedule(type: 'solar' | 'lunar'): CombinedEntry[] {
		const filePath = getScheduleFile(type, this.currentYear, this.currentMonth);
		const monthStr = `${this.currentYear}-${this.currentMonth.toString().padStart(2, '0')}`;

		try {
			const rawData = fs.readFileSync(filePath, 'utf-8');
			const entries: ScheduleEntry[] = JSON.parse(rawData);

			Logger.log(`📂 Loaded: data/${type}/${monthStr}.json (${entries.length} entries)`);

			return entries.map((entry) => ({
				type,
				date: entry['bob.date'],
				time: entry['bob.time'],
				phoenixDate: entry['phx.date'],
				phoenixTime: entry['phx.time'],
			}));
		} catch (error) {
			Logger.warn(`Could not load data/${type}/${monthStr}.json: ${error}`);
			return [];
		}
	}

	/**
	 * Load both schedules and return combined entries
	 */
	getAllSchedules(): CombinedEntry[] {
		const solarEntries = this.loadSchedule('solar');
		const lunarEntries = this.loadSchedule('lunar');

		const allEntries = [...solarEntries, ...lunarEntries];

		if (solarEntries.length > 0) {
			Logger.log(`☀️  Solar: ${solarEntries.length} entries`);
		}
		if (lunarEntries.length > 0) {
			Logger.log(`🌙 Lunar: ${lunarEntries.length} entries`);
		}

		Logger.success(`Total: ${allEntries.length} scheduled entries loaded.`);
		return allEntries;
	}

	/**
	 * Find a scheduled capture for the current hour.
	 *
	 * Workflow timing:
	 * - Cron runs every hour at minute 0
	 * - Script checks for any capture scheduled this hour
	 * - If found, waits for the scheduled time, loads stream 3 min before, captures at exact time
	 */
	findScheduledCaptureThisWindow(schedule: CombinedEntry[]): ScheduledCapture | null {
		const now = new Date();

		// Get current date in LOCAL timezone (Bolivia when TZ=America/La_Paz)
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const currentDate = `${year}-${month}-${day}`;

		const currentHour = now.getHours();
		const currentMinute = now.getMinutes();

		Logger.log(`📅 Current date (local TZ): ${currentDate}`);
		Logger.log(
			`⏰ Current time (local TZ): ${currentHour}:${currentMinute.toString().padStart(2, '0')}`,
		);
		Logger.log(`🔍 Checking for captures in hour ${currentHour}:00-${currentHour}:59`);

		for (const entry of schedule) {
			// Check if the entry is for today
			if (entry.date !== currentDate) {
				continue;
			}

			// Parse the scheduled time
			const [scheduledHour, scheduledMinute] = entry.time.split(':').map(Number);

			// Check if it's within the current hour
			if (scheduledHour !== currentHour) {
				continue;
			}

			// Calculate milliseconds until the scheduled time
			const scheduledTime = new Date(now);
			scheduledTime.setHours(scheduledHour, scheduledMinute, 0, 0);
			const waitMs = scheduledTime.getTime() - now.getTime();

			// Always return the capture if it's in the current hour
			Logger.success(`✅ Found: ${entry.type} at ${entry.time}`);
			return { entry, waitMs: Math.max(0, waitMs) };
		}

		Logger.log(`⏸️  No capture scheduled in current hour.`);
		return null;
	}

	/**
	 * Get a random schedule entry (for testing)
	 */
	getRandomEntry(): CombinedEntry | null {
		const schedules = this.getAllSchedules();
		return schedules.length > 0 ? schedules[Math.floor(Math.random() * schedules.length)] : null;
	}
}
