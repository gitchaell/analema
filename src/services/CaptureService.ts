/**
 * =============================================================================
 * ANALEMA SOLAR Y LUNAR - Capture Service
 * =============================================================================
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import puppeteer from 'puppeteer';
import {
	CAMERAS,
	CAPTURES_DIR,
	PUPPETEER_OPTIONS,
	STREAM_LOAD_WAIT_MS,
	TIMEZONE,
	VIEWPORT,
} from '../config';
import type { CameraType, CaptureType } from '../types';
import { Logger } from '../utils/Logger';

/**
 * Service for capturing screenshots from webcams using Puppeteer
 */
export class CaptureService {
	/**
	 * Get the next sequential number for a capture type
	 * Counts existing files in captures directory matching the type
	 */
	private getNextSequenceNumber(type: CaptureType): number {
		this.ensureCapturesDir();

		try {
			const files = fs.readdirSync(CAPTURES_DIR);
			// Count files that start with capture_[type]_
			const pattern = new RegExp(`^capture_${type}_\\d{3}_`);
			const matchingFiles = files.filter((f) => pattern.test(f));
			return matchingFiles.length + 1;
		} catch {
			return 1;
		}
	}

	/**
	 * Generate filename for the screenshot
	 * Format: capture_[TYPE]_[SEQ]_[CAMERA]_[DATE]_[TIME].png
	 * SEQ is a 3-digit sequential number (001, 002, etc.) per capture type
	 */
	private generateFilename(type: CaptureType, camera: CameraType): string {
		const now = new Date();
		const date = now.toISOString().split('T')[0].replace(/-/g, '');
		const time = now.toTimeString().split(' ')[0].replace(/:/g, '').slice(0, 4);
		const seq = this.getNextSequenceNumber(type).toString().padStart(3, '0');
		return `capture_${type}_${seq}_${camera}_${date}_${time}.png`;
	}

	/**
	 * Ensure the captures directory exists
	 */
	private ensureCapturesDir(): void {
		if (!fs.existsSync(CAPTURES_DIR)) {
			fs.mkdirSync(CAPTURES_DIR, { recursive: true });
			Logger.log(`📁 Created captures directory: ${CAPTURES_DIR}`);
		}
	}

	/**
	 * Capture a screenshot from the specified camera
	 *
	 * @param camera - The camera to capture from (north/west)
	 * @param type - The type of capture (solar/lunar)
	 * @returns Path to the saved screenshot
	 */
	async capture(camera: CameraType, type: CaptureType): Promise<string> {
		const cameraUrl = CAMERAS[camera];

		Logger.log('🚀 Starting Puppeteer browser in headless mode...');

		const browser = await puppeteer.launch(PUPPETEER_OPTIONS);

		try {
			const page = await browser.newPage();

			// Set viewport for a good screenshot size
			await page.setViewport(VIEWPORT);

			Logger.log(`📍 Navigating to ${camera.toUpperCase()} camera: ${cameraUrl}`);
			Logger.log(`   Target: Ahwatukee - Phoenix, Arizona (${TIMEZONE.phoenixOffset})`);
			Logger.log(
				`   Current time in Bolivia: ${Logger.getTimestamp()} (${TIMEZONE.boliviaOffset})`,
			);

			await page.goto(cameraUrl, {
				waitUntil: 'networkidle2',
				timeout: 60000,
			});

			// Wait for the stream to fully load
			Logger.log(`⏳ Waiting ${STREAM_LOAD_WAIT_MS / 1000} seconds for stream to load...`);
			await new Promise((resolve) => setTimeout(resolve, STREAM_LOAD_WAIT_MS));

			// Ensure captures directory exists
			this.ensureCapturesDir();

			// Generate filename and take screenshot
			const filename = this.generateFilename(type, camera);
			const filepath = path.join(CAPTURES_DIR, filename);

			await page.screenshot({
				path: filepath,
				fullPage: false,
			});

			Logger.success(`📸 Screenshot saved: ${filename}`);
			return filepath;
		} finally {
			await browser.close();
			Logger.log('🔒 Browser closed.');
		}
	}

	/**
	 * Log timezone information after capture
	 */
	logTimezoneInfo(): void {
		const now = new Date();
		const phoenixTime = now.toLocaleTimeString('en-US', {
			timeZone: TIMEZONE.phoenix,
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
		});
		Logger.log(`   Photo taken at ${Logger.getTimestamp()} Bolivia time`);
		Logger.log(`   (This corresponds to ${phoenixTime} Phoenix time)`);
	}
}
