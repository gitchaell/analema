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

import { getCamerasForLocation, LOCATIONS } from '../src/config/locations';
import { PuppeteerCaptureService } from '../src/infrastructure/services/PuppeteerCaptureService';
import { CaptureType } from '../src/types';
import { Logger } from '../src/utils/Logger';

async function test(): Promise<void> {
	Logger.header('ANALEMA SOLAR Y LUNAR - Capture Test');
	Logger.log('🧪 Running in TEST MODE - Immediate capture on ALL cameras');
	Logger.log(`📅 Current time: ${new Date().toString()}`);
	console.log('');

	// Initialize services
	// Use 5 seconds wait time for test instead of 3 minutes
	const captureService = new PuppeteerCaptureService(5000);

	// Use Phoenix location
	const location = LOCATIONS.find((l) => l.id === 'phoenix');
	if (!location) {
		Logger.error('Phoenix location not found');
		process.exit(1);
	}

	// Use solar as default type
	const type: CaptureType = 'solar';

	console.log('');
	Logger.log('🎯 TEST CAPTURE CONFIGURATION');
	Logger.log(`   Type: ${type.toUpperCase()}`);
	Logger.log(`   Location: ${location.name}`);
	Logger.log('   Cameras: ALL available');
	console.log('');

	// Execute capture on ALL cameras immediately
	try {
		const cameras = getCamerasForLocation(location.id);
		Logger.log(
			`🚀 Starting immediate capture on ${cameras.length} cameras...`,
		);
		console.log('');

		const filepaths = await captureService.capture(location, cameras, type);

		console.log('');
		Logger.log('🎉 TEST CAPTURE COMPLETE');
		Logger.log(`   Total files: ${filepaths.length}`);
		for (const fp of filepaths) {
			Logger.log(`   - ${fp}`);
		}
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
