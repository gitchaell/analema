/**
 * =============================================================================
 * ANALEMA SOLAR Y LUNAR - Timezone Test Script
 * =============================================================================
 *
 * Test script to verify that date/time detection works correctly with TZ.
 *
 * Usage: npm run test:timezone
 * =============================================================================
 */

import { LOCATIONS } from '../src/config/locations';
import { ConfigScheduleRepository } from '../src/infrastructure/repositories/ConfigScheduleRepository';
import { Logger } from '../src/utils/Logger';

async function testTimezone(): Promise<void> {
	Logger.header('TIMEZONE TEST');

	const now = new Date();

	// Test 1: Check TZ environment variable
	Logger.log(`🌍 TZ Environment: ${process.env.TZ || 'NOT SET'}`);

	// Test 2: Compare UTC vs Local date
	const utcDate = now.toISOString().split('T')[0];
	const localYear = now.getFullYear();
	const localMonth = String(now.getMonth() + 1).padStart(2, '0');
	const localDay = String(now.getDate()).padStart(2, '0');
	const localDate = `${localYear}-${localMonth}-${localDay}`;

	Logger.log(`📅 UTC Date (toISOString): ${utcDate}`);
	Logger.log(`📅 Local Date (getFullYear/Month/Date): ${localDate}`);

	if (utcDate !== localDate) {
		Logger.warn(`⚠️  Dates differ! This would cause schedule mismatches.`);
	} else {
		Logger.success(`✅ Dates match.`);
	}

	// Test 3: Check time
	const utcHours = now.getUTCHours();
	const localHours = now.getHours();
	const utcMinutes = now.getUTCMinutes();
	const localMinutes = now.getMinutes();

	Logger.log(
		`⏰ UTC Time: ${utcHours}:${String(utcMinutes).padStart(2, '0')}`,
	);
	Logger.log(
		`⏰ Local Time: ${localHours}:${String(localMinutes).padStart(2, '0')}`,
	);
	Logger.log(
		`⏰ Expected Offset: ${(localHours - utcHours + 24) % 24} hours`,
	);

	console.log('');

	// Test 4: Check schedule loading (Dynamic)
	Logger.log('📂 Testing schedule loading (Config-based)...');
	const repo = new ConfigScheduleRepository();

	for (const location of LOCATIONS) {
		Logger.log(`   Checking location: ${location.name} (ID: ${location.id})`);
		const schedule = await repo.getSchedule(location.id, now);

		const todayEntries = schedule; // getSchedule now returns entries for the given day
		Logger.log(
			`      Found ${todayEntries.length} entries for today (${localDate}):`,
		);
		for (const entry of todayEntries) {
			Logger.log(
				`         - ${entry.object} at ${entry.time} (Target: ${entry.targetTime})`,
			);
		}
	}

	console.log('');
	Logger.success('Test complete!');
}

testTimezone().catch((error) => {
	console.error('Unhandled error:', error);
	process.exit(1);
});
