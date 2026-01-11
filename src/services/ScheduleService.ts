/**
 * =============================================================================
 * ANALEMA SOLAR Y LUNAR - Schedule Service
 * =============================================================================
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getCurrentYearMonth, getScheduleFile } from '../config';
import type { CombinedEntry, ScheduledCapture, ScheduleFile } from '../types';
import { Logger } from '../utils/Logger';

/**
 * Service for loading and querying capture schedules
 */
export class ScheduleService {
	private solarSchedule: ScheduleFile | null = null;
	private lunarSchedule: ScheduleFile | null = null;
	private currentYear: number;
	private currentMonth: number;

	constructor() {
		const { year, month } = getCurrentYearMonth();
		this.currentYear = year;
		this.currentMonth = month;
	}

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
	 * Load solar schedule for the current month
	 */
	loadSolarSchedule(): ScheduleFile | null {
		const filePath = getScheduleFile('solar', this.currentYear, this.currentMonth);
		Logger.log(
			`📂 Loading from: data/solar/${this.currentYear}-${this.currentMonth.toString().padStart(2, '0')}/`,
		);
		this.solarSchedule = this.loadFile(filePath);
		if (this.solarSchedule) {
			Logger.log(`☀️  Loaded ${this.solarSchedule.schedule.length} solar entries`);
		}
		return this.solarSchedule;
	}

	/**
	 * Load lunar schedule for the current month
	 */
	loadLunarSchedule(): ScheduleFile | null {
		const filePath = getScheduleFile('lunar', this.currentYear, this.currentMonth);
		this.lunarSchedule = this.loadFile(filePath);
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
	 * Find a scheduled capture within the current 30-minute window
	 * GitHub Actions runs every 30 min (at :00 and :30)
	 * Window 1: minutes 00-29, Window 2: minutes 30-59
	 * Returns the matching entry and milliseconds to wait, or null if none found
	 */
	findScheduledCaptureThisWindow(schedule: CombinedEntry[]): ScheduledCapture | null {
		const now = new Date();
		const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
		const currentHour = now.getHours();
		const currentMinute = now.getMinutes();

		// Determine which 30-minute window we're in (0-29 or 30-59)
		const windowStart = currentMinute < 30 ? 0 : 30;
		const windowEnd = currentMinute < 30 ? 29 : 59;

		Logger.log(
			`🔍 Checking for captures in window ${currentHour}:${windowStart.toString().padStart(2, '0')}-${currentHour}:${windowEnd.toString().padStart(2, '0')}`,
		);

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

			// Check if it's within the current 30-minute window
			if (scheduledMinute < windowStart || scheduledMinute > windowEnd) {
				continue;
			}

			// Calculate milliseconds until the scheduled time
			const scheduledTime = new Date(now);
			scheduledTime.setHours(scheduledHour, scheduledMinute, 0, 0);

			const waitMs = scheduledTime.getTime() - now.getTime();

			// Allow 7 minute grace period (2 min GitHub delay + 5 min stream load time)
			// This ensures captures are detected even if we're slightly past the scheduled time
			if (waitMs >= -420000) {
				return { entry, waitMs: Math.max(0, waitMs) };
			}
		}

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
