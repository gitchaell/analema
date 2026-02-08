/**
 * =============================================================================
 * ANALEMA SOLAR Y LUNAR - Sky Photographer (Production Entry)
 * =============================================================================
 *
 * Automated screenshot capture system for configured locations (e.g., Phoenix).
 *
 * This script RELIES on the system timezone being set to 'America/La_Paz' (Bolivia).
 * In GitHub Actions, this is configured via the TZ environment variable.
 * =============================================================================
 */

import { Scheduler } from './application/Scheduler';
import { ConfigScheduleRepository } from './infrastructure/repositories/ConfigScheduleRepository';
import { PuppeteerCaptureService } from './infrastructure/services/PuppeteerCaptureService';
import { Logger } from './utils/Logger';

async function main(): Promise<void> {
	Logger.header('ANALEMA SOLAR Y LUNAR - Sky Photographer');
	Logger.log('🌎 System timezone should be set to America/La_Paz (Bolivia, UTC-4)');
	Logger.log(`📅 Current system date/time: ${new Date().toString()}`);
	console.log('');

	// Initialize new DDD components
	// Use configuration-based repository instead of JSON files
	const scheduleRepository = new ConfigScheduleRepository();
	const captureService = new PuppeteerCaptureService(); // Uses default wait time from config
	const scheduler = new Scheduler(scheduleRepository, captureService);

	// Run the check and capture process
	try {
		await scheduler.checkAndCapture();
		Logger.success('✅ Scheduler run complete.');
		process.exit(0);
	} catch (error) {
		Logger.error(`Error during scheduler run: ${error}`);
		process.exit(1);
	}
}

// Run the main function
main().catch((error) => {
	console.error('Unhandled error:', error);
	process.exit(1);
});
