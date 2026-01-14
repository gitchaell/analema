/**
 * =============================================================================
 * ANALEMA SOLAR Y LUNAR - Sky Photographer (Production Entry)
 * =============================================================================
 *
 * Automated screenshot capture system for the Ahwatukee - Phoenix, Arizona webcam.
 *
 * This script RELIES on the system timezone being set to 'America/La_Paz' (Bolivia).
 * In GitHub Actions, this is configured via the TZ environment variable.
 *
 * TIMING LOGIC:
 * The camera stream takes ~5 minutes to load. To capture at the exact scheduled time,
 * we start the browser/navigation 5 minutes BEFORE the scheduled time. This way,
 * when the stream finishes loading, it's exactly the moment to take the photo.
 *
 * TIMEZONE CONFIGURATION:
 * - User Location: Santa Cruz, Bolivia (UTC-4 / America/La_Paz)
 * - Target Location: Phoenix, Arizona, USA (UTC-7 / No DST)
 * - Offset: Bolivia is +3 hours ahead of Phoenix
 * =============================================================================
 */

import { STREAM_LOAD_WAIT_MS } from './config';
import { CaptureService } from './services/CaptureService';
import { ScheduleService } from './services/ScheduleService';
import { Logger } from './utils/Logger';

async function main(): Promise<void> {
	Logger.header('ANALEMA SOLAR Y LUNAR - Sky Photographer');
	Logger.log('Target: Ahwatukee - Phoenix, Arizona, USA');
	Logger.log('🌎 System timezone should be set to America/La_Paz (Bolivia, UTC-4)');
	Logger.log(`📅 Current system date/time: ${new Date().toString()}`);
	console.log('');

	// Initialize services
	const scheduleService = new ScheduleService();
	const captureService = new CaptureService();

	// Load all schedules
	Logger.log('📖 Loading schedules...');
	const allSchedules = scheduleService.getAllSchedules();

	if (allSchedules.length === 0) {
		Logger.error('No schedule entries found. Exiting.');
		process.exit(1);
	}

	// Check for scheduled capture in current hour
	const scheduled = scheduleService.findScheduledCaptureThisWindow(allSchedules);

	if (!scheduled) {
		console.log('');
		Logger.log('⏸️  No capture scheduled for this hour.');
		Logger.log('💤 Exiting to save resources. Will check again next hour.');
		console.log('');
		process.exit(0);
	}

	const { entry, waitMs } = scheduled;

	// Calculate when to START the capture (5 min before scheduled time for stream to load)
	const streamLoadTimeMs = STREAM_LOAD_WAIT_MS;
	const startCaptureInMs = Math.max(0, waitMs - streamLoadTimeMs);

	console.log('');
	Logger.log('🎯 CAPTURE SCHEDULED');
	Logger.log(`   Type: ${entry.type.toUpperCase()}`);
	Logger.log(`   Scheduled photo time: ${entry.time} (Bolivia, UTC-4)`);
	Logger.log(`   Cameras: ALL (north, northeast, multiple, west)`);
	Logger.log(`   Phoenix time: ${entry.phoenixTime} (UTC-7)`);
	console.log('');

	Logger.log('⏱️  TIMING CALCULATION');
	Logger.log(`   Stream load time: ${Math.round(streamLoadTimeMs / 60000)} minutes`);
	Logger.log(`   Time until scheduled capture: ${Math.round(waitMs / 60000)} minutes`);
	Logger.log(`   Will start browser in: ${Math.round(startCaptureInMs / 60000)} minutes`);
	console.log('');

	// Wait until it's time to START the capture (accounting for stream load time)
	if (startCaptureInMs > 0) {
		const waitMinutes = Math.round(startCaptureInMs / 60000);
		const waitSeconds = Math.round((startCaptureInMs % 60000) / 1000);
		Logger.log(
			`⏰ Waiting ${waitMinutes} minutes and ${waitSeconds} seconds before starting capture...`,
		);
		Logger.log(`   (${startCaptureInMs.toLocaleString()} milliseconds)`);
		Logger.log(`   Stream will load while waiting, photo taken at exactly ${entry.time}`);

		await new Promise((resolve) => setTimeout(resolve, startCaptureInMs));

		Logger.success('Wait complete. Starting browser now...');
	} else {
		Logger.success('Starting capture immediately (stream will load for photo time)...');
	}

	console.log('');

	// Execute capture on ALL cameras
	try {
		const filepaths = await captureService.captureAll(entry.type);

		console.log('');
		Logger.log('🎉 CAPTURE COMPLETE');
		Logger.log(`   Total files: ${filepaths.length}`);
		for (const fp of filepaths) {
			Logger.log(`   - ${fp}`);
		}
		captureService.logTimezoneInfo();
		console.log('');

		process.exit(0);
	} catch (error) {
		Logger.error(`Error during capture: ${error}`);
		process.exit(1);
	}
}

// Run the main function
main().catch((error) => {
	console.error('Unhandled error:', error);
	process.exit(1);
});
