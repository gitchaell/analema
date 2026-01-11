/**
 * =============================================================================
 * ANALEMA SOLAR Y LUNAR - Configuration
 * =============================================================================
 *
 * TIMEZONE CONFIGURATION:
 * - User Location: Santa Cruz, Bolivia (UTC-4 / America/La_Paz)
 * - Target Location: Phoenix, Arizona, USA (UTC-7 / No DST)
 * - Offset: Bolivia is +3 hours ahead of Phoenix
 * - Example: 10:00 AM Phoenix = 1:00 PM (13:00) Bolivia
 */

import * as path from 'node:path';
import type { PuppeteerLaunchOptions } from 'puppeteer';
import type { CameraType } from '../types';

/**
 * Camera URLs for the Phoenix, Arizona webcam
 */
export const CAMERAS: Record<CameraType, string> = {
	north: 'https://www.myearthcam.com/insideoutaerial/lowercam2',
	northeast: 'https://www.myearthcam.com/insideoutaerial/lowercam3',
	west: 'https://myearthcam.com/insideoutaerial',
};

/** Time to wait for the webcam stream to fully load (in milliseconds) */
export const STREAM_LOAD_WAIT_MS = 3 * 60 * 1000; // 3 minutes - camera service is slow to load

/** Directory for saving captured screenshots */
export const CAPTURES_DIR = path.join(process.cwd(), 'captures');

/** Base directory for schedule data */
export const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Get the path to the data directory for a specific type and month
 * Format: data/solar/YYYY-MM/ or data/lunar/YYYY-MM/
 */
export function getMonthDir(type: 'solar' | 'lunar', year: number, month: number): string {
	const monthStr = month.toString().padStart(2, '0');
	return path.join(DATA_DIR, type, `${year}-${monthStr}`);
}

/**
 * Get the path to the schedule file for a specific type and month
 * Format: data/solar/YYYY-MM/schedule.json
 */
export function getScheduleFile(type: 'solar' | 'lunar', year: number, month: number): string {
	return path.join(getMonthDir(type, year, month), 'schedule.json');
}

/**
 * Get the path to the input file for a specific type and month
 * Format: data/solar/YYYY-MM/input.json
 */
export function getInputFile(type: 'solar' | 'lunar', year: number, month: number): string {
	return path.join(getMonthDir(type, year, month), 'input.json');
}

/**
 * Get the current year and month
 */
export function getCurrentYearMonth(): { year: number; month: number } {
	const now = new Date();
	return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** Timezone configuration */
export const TIMEZONE = {
	bolivia: 'America/La_Paz',
	phoenix: 'America/Phoenix',
	boliviaOffset: 'UTC-4',
	phoenixOffset: 'UTC-7',
} as const;

/** Puppeteer launch options - optimized for GitHub Actions */
export const PUPPETEER_OPTIONS: PuppeteerLaunchOptions = {
	headless: 'new', // Use new headless mode (Chrome 112+)
	args: [
		'--no-sandbox',
		'--disable-setuid-sandbox',
		'--disable-dev-shm-usage',
		'--disable-gpu',
		'--disable-web-security',
		'--disable-features=IsolateOrigins,site-per-process',
		'--window-size=1024,690',
		// Reduce detection as headless browser
		'--disable-blink-features=AutomationControlled',
		'--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	],
};

/** Viewport settings for screenshots */
export const VIEWPORT = {
	width: 1024, // 1920,
	height: 690, // 1080,
} as const;
