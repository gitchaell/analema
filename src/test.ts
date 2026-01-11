/**
 * =============================================================================
 * ANALEMA SOLAR Y LUNAR - Test Script
 * =============================================================================
 *
 * Test script for immediate capture without waiting for scheduled time.
 * Useful for development and testing Puppeteer functionality.
 *
 * Usage: npm run test
 * =============================================================================
 */

import { CAMERAS } from './config';
import { CaptureService } from './services/CaptureService';
import { ScheduleService } from './services/ScheduleService';
import type { CameraType, CaptureType } from './types';
import { Logger } from './utils/Logger';

async function test(): Promise<void> {
	Logger.header('ANALEMA SOLAR Y LUNAR - Test Mode');
	Logger.log('🧪 Running in TEST MODE - Immediate capture, no waiting');
	Logger.log(`📅 Current time: ${new Date().toString()}`);
	console.log('');

	// Initialize services
	const scheduleService = new ScheduleService();
	const captureService = new CaptureService();

	// Try to get first schedule entry, or use defaults
	Logger.log('📖 Loading schedules...');
	const randomEntry = scheduleService.getRandomEntry();

	let camera: CameraType;
	let type: CaptureType;

	if (randomEntry) {
		camera = randomEntry.camera;
		type = randomEntry.type;
		Logger.success(`Using first schedule entry: ${type} - ${camera}`);
	} else {
		// Default test values
		camera = 'north';
		type = 'solar';
		Logger.warn('No schedule entries found. Using defaults: solar - north');
	}

	console.log('');
	Logger.log('🎯 TEST CAPTURE CONFIGURATION');
	Logger.log(`   Type: ${type.toUpperCase()}`);
	Logger.log(`   Camera: ${camera.toUpperCase()} - ${CAMERAS[camera]}`);
	console.log('');

	// Execute capture immediately (no waiting)
	try {
		Logger.log('🚀 Starting immediate capture...');
		console.log('');

		const filepath = await captureService.capture(camera, type);

		console.log('');
		Logger.log('🎉 TEST CAPTURE COMPLETE');
		Logger.log(`   File: ${filepath}`);
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
