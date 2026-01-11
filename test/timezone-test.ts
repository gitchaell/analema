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

import { getCurrentYearMonth, getScheduleFile } from '../src/config';
import { ScheduleService } from '../src/services/ScheduleService';
import { Logger } from '../src/utils/Logger';

function testTimezone(): void {
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

	Logger.log(`⏰ UTC Time: ${utcHours}:${String(utcMinutes).padStart(2, '0')}`);
	Logger.log(`⏰ Local Time: ${localHours}:${String(localMinutes).padStart(2, '0')}`);
	Logger.log(`⏰ Expected Offset: ${(localHours - utcHours + 24) % 24} hours`);

	console.log('');

	// Test 4: Check schedule loading
	Logger.log('📂 Testing schedule loading...');
	const { year, month } = getCurrentYearMonth();
	Logger.log(`   Current year/month: ${year}-${String(month).padStart(2, '0')}`);

	const solarPath = getScheduleFile('solar', year, month);
	const lunarPath = getScheduleFile('lunar', year, month);
	Logger.log(`   Solar schedule path: ${solarPath}`);
	Logger.log(`   Lunar schedule path: ${lunarPath}`);

	console.log('');

	// Test 5: Test window detection
	Logger.log('🔍 Testing window detection for today...');
	const scheduleService = new ScheduleService();
	const allSchedules = scheduleService.getAllSchedules();

	// Find today's entries
	const todayEntries = allSchedules.filter((e) => e.date === localDate);
	Logger.log(`   Found ${todayEntries.length} entries for today (${localDate}):`);
	for (const entry of todayEntries) {
		Logger.log(`      - ${entry.type} at ${entry.time}`);
	}

	console.log('');

	// Test 6: Check if any capture should happen now
	const scheduled = scheduleService.findScheduledCaptureThisWindow(allSchedules);
	if (scheduled) {
		Logger.success(`🎯 Capture scheduled: ${scheduled.entry.type} at ${scheduled.entry.time}`);
		Logger.log(`   Wait time: ${Math.round(scheduled.waitMs / 1000)} seconds`);
	} else {
		Logger.log(`⏸️  No capture scheduled in current 30-min window.`);
	}

	console.log('');
	Logger.success('Test complete!');
}

testTimezone();
