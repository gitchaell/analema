/**
 * =============================================================================
 * ANALEMA SOLAR Y LUNAR - Capture Test Script
 * =============================================================================
 *
 * Test script for immediate capture without waiting for scheduled time.
 * Captures from ALL cameras for a random type (solar/lunar).
 *
 * Usage: npm run test:capture
 * =============================================================================
 */

import { CaptureService } from '../src/services/CaptureService';
import { ScheduleService } from '../src/services/ScheduleService';
import type { CaptureType } from '../src/types';
import { Logger } from '../src/utils/Logger';

async function test(): Promise<void> {
	Logger.header('ANALEMA SOLAR Y LUNAR - Capture Test');
	Logger.log('🧪 Running in TEST MODE - Immediate capture on ALL cameras');
	Logger.log(`📅 Current time: ${new Date().toString()}`);
	console.log('');

	// Initialize services
	const scheduleService = new ScheduleService();
	const captureService = new CaptureService();

	// Try to get a random schedule entry for the type, or use default
	Logger.log('📖 Loading schedules...');
	const randomEntry = scheduleService.getRandomEntry();

	let type: CaptureType;

	if (randomEntry) {
		type = randomEntry.type;
		Logger.success(`Using schedule entry type: ${type.toUpperCase()}`);
	} else {
		type = 'solar';
		Logger.warn('No schedule entries found. Using default: solar');
	}

	console.log('');
	Logger.log('🎯 TEST CAPTURE CONFIGURATION');
	Logger.log(`   Type: ${type.toUpperCase()}`);
	Logger.log('   Cameras: ALL (north, northeast, west)');
	console.log('');

	// Execute capture on ALL cameras immediately
	try {
		Logger.log('🚀 Starting immediate capture on all cameras...');
		console.log('');

		const filepaths = await captureService.captureAll(type);

		console.log('');
		Logger.log('🎉 TEST CAPTURE COMPLETE');
		Logger.log(`   Total files: ${filepaths.length}`);
		for (const fp of filepaths) {
			Logger.log(`   - ${fp}`);
		}
		captureService.logTimezoneInfo();
		console.log('');

		Logger.success('Test completed successfully!');
		process.exit(0);
	} catch (error) {
		Logger.error(`Test capture failed: ${error}`);
		process.exit(1);
	}
}

// Run the test function
test().catch((error) => {
	console.error('Unhandled error:', error);
	process.exit(1);
});
