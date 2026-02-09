/**
 * =============================================================================
 * SOLAR AND LUNAR ANALEMMA - Sky Photographer (Production Entry)
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
	Logger.header('SOLAR AND LUNAR ANALEMMA - Sky Photographer');
	Logger.log('🌎 System timezone should be set to America/La_Paz (Bolivia, UTC-4)');
	Logger.log(`📅 Current system date/time: ${new Date().toString()}`);
	console.log('');

	const scheduleRepository = new ConfigScheduleRepository();
	const captureService = new PuppeteerCaptureService();
	const scheduler = new Scheduler(scheduleRepository, captureService);

	try {
		await scheduler.checkAndCapture();
		Logger.success('✅ Scheduler run complete.');
		process.exit(0);
	} catch (error) {
		Logger.error(`Error during scheduler run: ${error}`);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error('Unhandled error:', error);
	process.exit(1);
});
