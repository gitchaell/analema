import * as fs from 'node:fs';
import * as path from 'node:path';
import puppeteer, { type Browser, type Page, type PuppeteerLaunchOptions } from 'puppeteer';
import { CAPTURES_DIR } from '../../config';
import type { Camera } from '../../domain/entities/Camera';
import type { Location } from '../../domain/entities/Location';
import type { CameraDirection, CelestialObject, LocationId } from '../../domain/entities/Types';
import type { CaptureService } from '../../domain/services/CaptureService';
import { Logger } from '../../utils/Logger';

/** Time to wait for the webcam stream to fully load (in milliseconds) */
export const STREAM_LOAD_WAIT_MS = 3 * 60 * 1000; // 3 minutes - camera service is slow to load

/** Puppeteer launch options - optimized for GitHub Actions */
const PUPPETEER_OPTIONS: PuppeteerLaunchOptions = {
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
const VIEWPORT = {
	width: 1024, // 1920,
	height: 690, // 1080,
} as const;

/**
 * Service for capturing screenshots from webcams using Puppeteer
 */
export class PuppeteerCaptureService implements CaptureService {
	private readonly waitMs: number;

	constructor(waitMs: number = STREAM_LOAD_WAIT_MS) {
		this.waitMs = waitMs;
	}

	/**
	 * Get the capture directory for a specific location, object and camera direction
	 * Structure: captures/[locationId]/[object]/[direction]
	 */
	private getCaptureDir(
		locationId: LocationId,
		object: CelestialObject,
		direction: CameraDirection,
	): string {
		return path.join(CAPTURES_DIR, locationId, object, direction);
	}

	/**
	 * Ensure the captures subdirectory exists
	 */
	private ensureCaptureDir(
		locationId: LocationId,
		object: CelestialObject,
		direction: CameraDirection,
	): string {
		const dir = this.getCaptureDir(locationId, object, direction);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
			Logger.log(`📁 Created directory: ${dir}`);
		}
		return dir;
	}

	/**
	 * Get the next sequential number for a capture object/camera combo
	 */
	private getNextSequenceNumber(
		locationId: LocationId,
		object: CelestialObject,
		direction: CameraDirection,
	): number {
		const dir = this.getCaptureDir(locationId, object, direction);

		try {
			if (!fs.existsSync(dir)) return 1;
			const files = fs.readdirSync(dir);
			const pngFiles = files.filter((file) => file.endsWith('.png'));
			return pngFiles.length + 1;
		} catch {
			return 1;
		}
	}

	/**
	 * Generate filename for the screenshot
	 */
	private generateFilename(
		locationId: LocationId,
		object: CelestialObject,
		direction: CameraDirection,
	): string {
		const now = new Date();
		const date = now.toISOString().split('T')[0].replace(/-/g, '');
		const time = now.toTimeString().split(' ')[0].replace(/:/g, '').slice(0, 4);
		const seq = this.getNextSequenceNumber(locationId, object, direction)
			.toString()
			.padStart(3, '0');
		return `${seq}_${date}_${time}.png`;
	}

	/**
	 * Prepare a browser and page for a single camera
	 */
	private async prepareCamera(
		camera: Camera,
		object: CelestialObject,
	): Promise<{
		browser: Browser;
		page: Page;
		camera: Camera;
		object: CelestialObject;
	}> {
		Logger.log(
			`📍 [${camera.direction.toUpperCase()}] Launching browser and navigating to ${camera.url}...`,
		);

		const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
		const page = await browser.newPage();
		await page.setViewport(VIEWPORT);

		await page.goto(camera.url, {
			waitUntil: 'networkidle2',
			timeout: 2 * 60 * 1000, // 2 minute timeout
		});

		Logger.log(`⏳ [${camera.direction.toUpperCase()}] Page loaded, waiting for stream...`);

		return { browser, page, camera, object };
	}

	/**
	 * Take screenshot from a prepared page
	 */
	private async takeScreenshot(
		page: Page,
		camera: Camera,
		object: CelestialObject,
		locationId: LocationId,
	): Promise<string> {
		const captureDir = this.ensureCaptureDir(locationId, object, camera.direction);

		const filename = this.generateFilename(locationId, object, camera.direction);
		const filepath = path.join(captureDir, filename);

		await page.screenshot({
			path: filepath,
			fullPage: false,
		});

		Logger.success(
			`📸 [${camera.direction.toUpperCase()}] Saved: ${locationId}/${object}/${camera.direction}/${filename}`,
		);
		return filepath;
	}

	/**
	 * Capture screenshots from ALL location cameras - IN PARALLEL
	 */
	async capture(location: Location, object: CelestialObject): Promise<string[]> {
		const cameras = location.cameras;

		Logger.log(`🚀 Starting PARALLEL capture for ${object.toUpperCase()} at ${location.name}...`);
		Logger.log(`   Cameras: ${cameras.map((c) => c.direction).join(', ')}`);
		Logger.log(`   Stream wait time: ${this.waitMs / 60000} minutes`);
		console.log('');

		// Step 1: Launch all browsers in PARALLEL
		Logger.log(`🔄 Launching ${cameras.length} browsers in parallel...`);
		const preparePromises = cameras.map((camera) => this.prepareCamera(camera, object));

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
		const screenshotPromises = preparedCameras.map(
			async ({ page, camera, object: captureObject }) => {
				try {
					const filepath = await this.takeScreenshot(page, camera, captureObject, location.id);
					results.push(filepath);
				} catch (error) {
					Logger.error(`[${camera.direction.toUpperCase()}] Screenshot failed: ${error}`);
				}
			},
		);

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
		} catch (error) {
			Logger.warn(`Could not format time for timezone ${location.timezone}: ${error}`);
		}
	}
}
