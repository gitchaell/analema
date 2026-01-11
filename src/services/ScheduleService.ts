/**
 * =============================================================================
 * ANALEMA SOLAR Y LUNAR - Schedule Service
 * =============================================================================
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { LUNAR_SCHEDULE_FILE, SOLAR_SCHEDULE_FILE } from '../config';
import type { CombinedEntry, ScheduledCapture, ScheduleFile } from '../types';
import { Logger } from '../utils/Logger';

/**
 * Service for loading and querying capture schedules
 */
export class ScheduleService {
	private solarSchedule: ScheduleFile | null = null;
	private lunarSchedule: ScheduleFile | null = null;

	/**
	 * Load a schedule file from disk
	 */
	private loadFile(filePath: string): ScheduleFile | null {
		try {
			const rawData = fs.readFileSync(filePath, 'utf-8');
			return JSON.parse(rawData) as ScheduleFile;
		} catch (error) {
			Logger.warn(`Could not load ${path.basename(filePath)}: ${error}`);
			return null;
		}
	}

	/**
	 * Load solar schedule from file
	 */
	loadSolarSchedule(): ScheduleFile | null {
		this.solarSchedule = this.loadFile(SOLAR_SCHEDULE_FILE);
		if (this.solarSchedule) {
			Logger.log(`☀️  Loaded ${this.solarSchedule.schedule.length} solar entries`);
		}
		return this.solarSchedule;
	}

	/**
	 * Load lunar schedule from file
	 */
	loadLunarSchedule(): ScheduleFile | null {
		this.lunarSchedule = this.loadFile(LUNAR_SCHEDULE_FILE);
		if (this.lunarSchedule) {
			Logger.log(`🌙 Loaded ${this.lunarSchedule.schedule.length} lunar entries`);
		}
		return this.lunarSchedule;
	}

	/**
	 * Load both schedules and return combined entries
	 */
	getAllSchedules(): CombinedEntry[] {
		const allEntries: CombinedEntry[] = [];

		// Load and combine solar entries
		const solar = this.loadSolarSchedule();
		if (solar) {
			for (const entry of solar.schedule) {
				allEntries.push({ ...entry, type: 'solar' });
			}
		}

		// Load and combine lunar entries
		const lunar = this.loadLunarSchedule();
		if (lunar) {
			for (const entry of lunar.schedule) {
				allEntries.push({ ...entry, type: 'lunar' });
			}
		}

		Logger.success(`Total: ${allEntries.length} scheduled entries loaded.`);
		return allEntries;
	}

	/**
	 * Find a scheduled capture within the current hour
	 * Returns the matching entry and milliseconds to wait, or null if none found
	 */
	findScheduledCaptureThisHour(schedule: CombinedEntry[]): ScheduledCapture | null {
		const now = new Date();
		const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
		const currentHour = now.getHours();

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

			// Allow 1 minute grace period for slight timing issues
			if (waitMs >= -60000) {
				return { entry, waitMs: Math.max(0, waitMs) };
			}
		}

		return null;
	}

	/**
	 * Get the random schedule entry (for testing)
	 */
	getRandomEntry(): CombinedEntry | null {
		const schedules = this.getAllSchedules();
		return schedules.length > 0 ? schedules[Math.floor(Math.random() * schedules.length)] : null;
	}
}
