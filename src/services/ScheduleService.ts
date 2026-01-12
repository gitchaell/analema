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
			// waitMs may be negative if we're past the scheduled time
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
