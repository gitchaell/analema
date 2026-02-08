import * as fs from 'node:fs';
import * as path from 'node:path';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import { CAPTURES_DIR, PUPPETEER_OPTIONS, STREAM_LOAD_WAIT_MS, VIEWPORT } from '../../config';
import type { Camera } from '../../domain/entities/Camera';
import type { Location } from '../../domain/entities/Location';
import type { ICaptureService } from '../../domain/services/ICaptureService';
import type { CaptureType } from '../../types';
import { Logger } from '../../utils/Logger';

/**
 * Service for capturing screenshots from webcams using Puppeteer
 */
export class PuppeteerCaptureService implements ICaptureService {
	private readonly waitMs: number;

	constructor(waitMs: number = STREAM_LOAD_WAIT_MS) {
		this.waitMs = waitMs;
	}

	/**
	 * Get the capture directory for a specific location, type and camera
	 * Structure: captures/[locationId]/[type]/[cameraType]
	 */
	private getCaptureDir(locationId: string, type: CaptureType, cameraType: string): string {
		return path.join(CAPTURES_DIR, locationId, type, cameraType);
	}

	/**
	 * Ensure the captures subdirectory exists
	 */
	private ensureCaptureDir(locationId: string, type: CaptureType, cameraType: string): string {
		const dir = this.getCaptureDir(locationId, type, cameraType);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
			Logger.log(`📁 Created directory: ${dir}`);
		}
		return dir;
	}

	/**
	 * Get the next sequential number for a capture type/camera combo
	 */
	private getNextSequenceNumber(locationId: string, type: CaptureType, cameraType: string): number {
		const dir = this.getCaptureDir(locationId, type, cameraType);

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
	 */
	private generateFilename(locationId: string, type: CaptureType, cameraType: string): string {
		const now = new Date();
		const date = now.toISOString().split('T')[0].replace(/-/g, '');
		const time = now.toTimeString().split(' ')[0].replace(/:/g, '').slice(0, 4);
		const seq = this.getNextSequenceNumber(locationId, type, cameraType)
			.toString()
			.padStart(3, '0');
		return `${seq}_${date}_${time}.png`;
	}

	/**
	 * Prepare a browser and page for a single camera
	 */
	private async prepareCamera(
		camera: Camera,
		type: CaptureType,
	): Promise<{ browser: Browser; page: Page; camera: Camera; type: CaptureType }> {
		Logger.log(
			`📍 [${camera.type.toUpperCase()}] Launching browser and navigating to ${camera.url}...`,
		);

		const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
		const page = await browser.newPage();
		await page.setViewport(VIEWPORT);

		await page.goto(camera.url, {
			waitUntil: 'networkidle2',
			timeout: 2 * 60 * 1000, // 2 minute timeout
		});

		Logger.log(`⏳ [${camera.type.toUpperCase()}] Page loaded, waiting for stream...`);

		return { browser, page, camera, type };
	}

	/**
	 * Take screenshot from a prepared page
	 */
	private async takeScreenshot(
		page: Page,
		camera: Camera,
		type: CaptureType,
		locationId: string,
	): Promise<string> {
		// Ensure captures subdirectory exists
		const captureDir = this.ensureCaptureDir(locationId, type, camera.type);

		// Generate filename and take screenshot
		const filename = this.generateFilename(locationId, type, camera.type);
		const filepath = path.join(captureDir, filename);

		await page.screenshot({
			path: filepath,
			fullPage: false,
		});

		Logger.success(
			`📸 [${camera.type.toUpperCase()}] Saved: ${locationId}/${type}/${camera.type}/${filename}`,
		);
		return filepath;
	}

	/**
	 * Capture screenshots from ALL provided cameras - IN PARALLEL
	 */
	async capture(location: Location, cameras: Camera[], type: CaptureType): Promise<string[]> {
		Logger.log(`🚀 Starting PARALLEL capture for ${type.toUpperCase()} at ${location.name}...`);
		Logger.log(`   Cameras: ${cameras.map((c) => c.type).join(', ')}`);
		Logger.log(`   Stream wait time: ${this.waitMs / 60000} minutes`);
		console.log('');

		// Step 1: Launch all browsers in PARALLEL
		Logger.log(`🔄 Launching ${cameras.length} browsers in parallel...`);
		const preparePromises = cameras.map((camera) => this.prepareCamera(camera, type));

		let preparedCameras: Awaited<ReturnType<typeof this.prepareCamera>>[] = [];
		try {
			preparedCameras = await Promise.all(preparePromises);
			Logger.success(`All ${cameras.length} browsers launched and pages loaded.`);
		} catch (error) {
			Logger.error(`Failed to prepare cameras: ${error}`);
			// Close any browsers that were opened
			for (const prepared of preparedCameras) {
				try {
					await prepared.browser.close();
				} catch {
					/* ignore */
				}
			}
			throw error;
		}

		console.log('');

		// Step 2: Wait for streams to fully load
		const waitMinutes = Math.round(this.waitMs / 60000);
		Logger.log(`⏳ Waiting ${waitMinutes} minutes for all streams to load...`);
		await new Promise((resolve) => setTimeout(resolve, this.waitMs));
		Logger.success('Stream wait complete!');

		console.log('');

		// Step 3: Take all screenshots simultaneously
		Logger.log('📸 Taking screenshots from all cameras NOW...');
		const captureTime = new Date();
		Logger.log(`   Capture timestamp: ${captureTime.toLocaleString()}`);

		const results: string[] = [];
		const screenshotPromises = preparedCameras.map(async ({ page, camera, type: captureType }) => {
			try {
				const filepath = await this.takeScreenshot(page, camera, captureType, location.id);
				results.push(filepath);
			} catch (error) {
				Logger.error(`[${camera.type.toUpperCase()}] Screenshot failed: ${error}`);
			}
		});

		await Promise.all(screenshotPromises);

		// Step 4: Close all browsers
		Logger.log('🔒 Closing all browsers...');
		const closePromises = preparedCameras.map(({ browser }) => browser.close());
		await Promise.all(closePromises);

		// Log timezone info
		this.logTimezoneInfo(location);

		return results;
	}

	private logTimezoneInfo(location: Location): void {
		const now = new Date();
		try {
			const localTime = now.toLocaleTimeString('en-US', {
				timeZone: location.timezone,
				hour: '2-digit',
				minute: '2-digit',
				hour12: false,
			});
			Logger.log(`   Photo taken at ${Logger.getTimestamp()} System time`);
			Logger.log(`   (This corresponds to ${localTime} ${location.name} time)`);
		} catch (e) {
			Logger.warn(`Could not format time for timezone ${location.timezone}: ${e}`);
		}
	}
}
