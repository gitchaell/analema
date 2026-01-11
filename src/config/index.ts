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
	west: 'https://myearthcam.com/insideoutaerial',
};

/** Time to wait for the webcam stream to fully load (in milliseconds) */
export const STREAM_LOAD_WAIT_MS = 20000; // 20 seconds (between 15-20 seconds)

/** Directory for saving captured screenshots */
export const CAPTURES_DIR = path.join(process.cwd(), 'captures');

/** Path to the solar schedule data file */
export const SOLAR_SCHEDULE_FILE = path.join(process.cwd(), 'data', 'solar-schedule.json');

/** Path to the lunar schedule data file */
export const LUNAR_SCHEDULE_FILE = path.join(process.cwd(), 'data', 'lunar-schedule.json');

/** Timezone configuration */
export const TIMEZONE = {
	bolivia: 'America/La_Paz',
	phoenix: 'America/Phoenix',
	boliviaOffset: 'UTC-4',
	phoenixOffset: 'UTC-7',
} as const;

/** Puppeteer launch options - optimized for GitHub Actions */
export const PUPPETEER_OPTIONS: PuppeteerLaunchOptions = {
	headless: true,
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
