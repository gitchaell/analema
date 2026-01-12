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
	 * Find a scheduled capture for the current 30-minute window.
	 *
	 * Workflow timing:
	 * - Cron runs at :27 and :57
	 * - Each run covers a 30-minute window:
	 *   - :27 covers captures from :00 to :29 (first half of hour)
	 *   - :57 covers captures from :30 to :59 (second half of hour)
	 * - Stream loads for 3 min before capture
	 * - Grace period of 5 min for late starts
	 */
	findScheduledCaptureThisWindow(schedule: CombinedEntry[]): ScheduledCapture | null {
		const now = new Date();
		const GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes

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

		// Determine which 30-minute window we're in
		// First half: minutes 00-29 (cron runs at :27)
		// Second half: minutes 30-59 (cron runs at :57)
		const inFirstHalf = currentMinute < 30;
		const windowStart = inFirstHalf ? 0 : 30;
		const windowEnd = inFirstHalf ? 29 : 59;

		Logger.log(
			`🔍 Checking for captures in window ${currentHour}:${String(windowStart).padStart(2, '0')}-${currentHour}:${String(windowEnd).padStart(2, '0')}`,
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

			// Allow detection if we're within grace period (5 min past scheduled time still OK)
			if (waitMs >= -GRACE_PERIOD_MS) {
				Logger.success(`✅ Found: ${entry.type} at ${entry.time}`);
				return { entry, waitMs: Math.max(0, waitMs) };
			}
		}

		Logger.log(`⏸️  No capture scheduled in current window.`);
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
