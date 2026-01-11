/**
 * =============================================================================
 * ANALEMA SOLAR Y LUNAR - Capture Service
 * =============================================================================
 *
 * PARALLEL CAPTURE STRATEGY:
 * All 3 cameras are launched simultaneously. Each browser navigates to its
 * camera URL, waits for the stream to load, and then takes the screenshot.
 * This ensures all photos are taken at approximately the same time.
 * =============================================================================
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
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

/** All available cameras */
const ALL_CAMERAS: CameraType[] = ['north', 'northeast', 'west'];

/**
 * Service for capturing screenshots from webcams using Puppeteer
 */
export class CaptureService {
	/**
	 * Get the capture directory for a specific type and camera
	 * Structure: captures/solar/north, captures/lunar/west, etc.
	 */
	private getCaptureDir(type: CaptureType, camera: CameraType): string {
		return path.join(CAPTURES_DIR, type, camera);
	}

	/**
	 * Ensure the captures subdirectory exists
	 */
	private ensureCaptureDir(type: CaptureType, camera: CameraType): string {
		const dir = this.getCaptureDir(type, camera);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
			Logger.log(`📁 Created directory: ${dir}`);
		}
		return dir;
	}

	/**
	 * Get the next sequential number for a capture type/camera combo
	 * Counts existing files in the specific subdirectory
	 */
	private getNextSequenceNumber(type: CaptureType, camera: CameraType): number {
		const dir = this.getCaptureDir(type, camera);

		try {
			if (!fs.existsSync(dir)) return 1;
			const files = fs.readdirSync(dir);
			const pngFiles = files.filter((f) => f.endsWith('.png'));
			return pngFiles.length + 1;
		} catch {
			return 1;
		}
	}

	/**
	 * Generate filename for the screenshot
	 * Format: [SEQ]_[DATE]_[TIME].png
	 * SEQ is a 3-digit sequential number (001, 002, etc.)
	 */
	private generateFilename(type: CaptureType, camera: CameraType): string {
		const now = new Date();
		const date = now.toISOString().split('T')[0].replace(/-/g, '');
		const time = now.toTimeString().split(' ')[0].replace(/:/g, '').slice(0, 4);
		const seq = this.getNextSequenceNumber(type, camera).toString().padStart(3, '0');
		return `${seq}_${date}_${time}.png`;
	}

	/**
	 * Prepare a browser and page for a single camera, wait for stream to load
	 * Returns the browser, page, and camera info for later screenshot
	 */
	private async prepareCamera(
		camera: CameraType,
		type: CaptureType,
	): Promise<{ browser: Browser; page: Page; camera: CameraType; type: CaptureType }> {
		const cameraUrl = CAMERAS[camera];

		Logger.log(`📍 [${camera.toUpperCase()}] Launching browser and navigating...`);

		const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
		const page = await browser.newPage();
		await page.setViewport(VIEWPORT);

		await page.goto(cameraUrl, {
			waitUntil: 'networkidle2',
			timeout: 2 * 60 * 1000, // 2 minute timeout for slow connections
		});

		Logger.log(`⏳ [${camera.toUpperCase()}] Page loaded, waiting for stream...`);

		return { browser, page, camera, type };
	}

	/**
	 * Take screenshot from a prepared page
	 */
	private async takeScreenshot(page: Page, camera: CameraType, type: CaptureType): Promise<string> {
		// Ensure captures subdirectory exists
		const captureDir = this.ensureCaptureDir(type, camera);

		// Generate filename and take screenshot
		const filename = this.generateFilename(type, camera);
		const filepath = path.join(captureDir, filename);

		await page.screenshot({
			path: filepath,
			fullPage: false,
		});

		Logger.success(`📸 [${camera.toUpperCase()}] Saved: ${type}/${camera}/${filename}`);
		return filepath;
	}

	/**
	 * Capture screenshots from ALL cameras for a given type - IN PARALLEL
	 * All browsers launch simultaneously, wait for streams, then capture at the same time
	 */
	async captureAll(type: CaptureType): Promise<string[]> {
		Logger.log(`🚀 Starting PARALLEL capture for ${type.toUpperCase()} on ALL cameras...`);
		Logger.log(`   Target: Ahwatukee - Phoenix, Arizona (${TIMEZONE.phoenixOffset})`);
		Logger.log(`   Current time in Bolivia: ${Logger.getTimestamp()} (${TIMEZONE.boliviaOffset})`);
		Logger.log(`   Stream wait time: ${STREAM_LOAD_WAIT_MS / 60000} minutes`);
		console.log('');

		// Step 1: Launch all browsers in PARALLEL and navigate to camera URLs
		Logger.log('🔄 Launching all 3 browsers in parallel...');
		const preparePromises = ALL_CAMERAS.map((camera) => this.prepareCamera(camera, type));

		let preparedCameras: Awaited<ReturnType<typeof this.prepareCamera>>[] = [];
		try {
			preparedCameras = await Promise.all(preparePromises);
			Logger.success('All 3 browsers launched and pages loaded.');
		} catch (error) {
			Logger.error(`Failed to prepare cameras: ${error}`);
			// Close any browsers that were opened
			for (const prepared of preparedCameras) {
				try {
					await prepared.browser.close();
				} catch {
					// Ignore close errors
				}
			}
			throw error;
		}

		console.log('');

		// Step 2: Wait for streams to fully load (same wait for all)
		const waitMinutes = Math.round(STREAM_LOAD_WAIT_MS / 60000);
		Logger.log(`⏳ Waiting ${waitMinutes} minutes for all streams to load...`);
		await new Promise((resolve) => setTimeout(resolve, STREAM_LOAD_WAIT_MS));
		Logger.success('Stream wait complete!');

		console.log('');

		// Step 3: Take all screenshots simultaneously
		Logger.log('📸 Taking screenshots from all cameras NOW...');
		const captureTime = new Date();
		Logger.log(`   Capture timestamp: ${captureTime.toLocaleString()}`);

		const results: string[] = [];
		const screenshotPromises = preparedCameras.map(async ({ page, camera, type: captureType }) => {
			try {
				const filepath = await this.takeScreenshot(page, camera, captureType);
				results.push(filepath);
			} catch (error) {
				Logger.error(`[${camera.toUpperCase()}] Screenshot failed: ${error}`);
			}
		});

		await Promise.all(screenshotPromises);

		// Step 4: Close all browsers
		Logger.log('🔒 Closing all browsers...');
		const closePromises = preparedCameras.map(({ browser }) => browser.close());
		await Promise.all(closePromises);

		return results;
	}

	/**
	 * Capture a single camera (for testing)
	 */
	async captureSingle(camera: CameraType, type: CaptureType): Promise<string> {
		const cameraUrl = CAMERAS[camera];

		Logger.log(`📍 Navigating to ${camera.toUpperCase()} camera: ${cameraUrl}`);

		const browser = await puppeteer.launch(PUPPETEER_OPTIONS);

		try {
			const page = await browser.newPage();
			await page.setViewport(VIEWPORT);

			await page.goto(cameraUrl, {
				waitUntil: 'networkidle2',
				timeout: 2 * 60 * 1000,
			});

			// Wait for the stream to fully load
			Logger.log(`⏳ Waiting ${STREAM_LOAD_WAIT_MS / 60000} minutes for stream to load...`);
			await new Promise((resolve) => setTimeout(resolve, STREAM_LOAD_WAIT_MS));

			// Ensure captures subdirectory exists
			const captureDir = this.ensureCaptureDir(type, camera);

			// Generate filename and take screenshot
			const filename = this.generateFilename(type, camera);
			const filepath = path.join(captureDir, filename);

			await page.screenshot({
				path: filepath,
				fullPage: false,
			});

			Logger.success(`📸 Saved: ${type}/${camera}/${filename}`);
			return filepath;
		} finally {
			await browser.close();
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
