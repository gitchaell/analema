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
 * TIMEZONE CONFIGURATION:
 * - User Location: Santa Cruz, Bolivia (UTC-4 / America/La_Paz)
 * - Target Location: Phoenix, Arizona, USA (UTC-7 / No DST)
 * - Offset: Bolivia is +3 hours ahead of Phoenix
 * =============================================================================
 */

import { CAMERAS } from './config';
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

	// Check for scheduled capture this hour
	const scheduled = scheduleService.findScheduledCaptureThisHour(allSchedules);

	if (!scheduled) {
		console.log('');
		Logger.log('⏸️  No capture scheduled for this hour.');
		Logger.log('💤 Exiting to save resources. Will check again next hour.');
		console.log('');
		process.exit(0);
	}

	const { entry, waitMs } = scheduled;

	console.log('');
	Logger.log('🎯 CAPTURE SCHEDULED THIS HOUR');
	Logger.log(`   Type: ${entry.type.toUpperCase()}`);
	Logger.log(`   Scheduled time: ${entry.time} (Bolivia, UTC-4)`);
	Logger.log(`   Camera: ${entry.camera.toUpperCase()} - ${CAMERAS[entry.camera]}`);
	if (entry.phoenix_time) {
		Logger.log(`   Phoenix time: ${entry.phoenix_time} (UTC-7)`);
	}
	if (entry.illumination) {
		Logger.log(`   Moon illumination: ${entry.illumination}`);
	}
	if (entry.notes) {
		Logger.log(`   Notes: ${entry.notes}`);
	}
	console.log('');

	// Wait until the scheduled time
	if (waitMs > 0) {
		const waitMinutes = Math.round(waitMs / 60000);
		const waitSeconds = Math.round((waitMs % 60000) / 1000);
		Logger.log(
			`⏰ Waiting ${waitMinutes} minutes and ${waitSeconds} seconds until capture time...`,
		);
		Logger.log(`   (${waitMs.toLocaleString()} milliseconds)`);

		await new Promise((resolve) => setTimeout(resolve, waitMs));

		Logger.success('Wait complete. Initiating capture...');
	} else {
		Logger.success('Capture time reached. Initiating capture immediately...');
	}

	console.log('');

	// Execute capture
	try {
		const filepath = await captureService.capture(entry.camera, entry.type);

		console.log('');
		Logger.log('🎉 CAPTURE COMPLETE');
		Logger.log(`   File: ${filepath}`);
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
