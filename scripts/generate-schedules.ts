#!/usr/bin/env npx ts-node
/**
 * Generate schedule files for all configured locations
 * - Uses configuration from src/config/locations.ts
 * - Calculates correct System Time (Bolivia) based on Location Timezone
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { LOCATIONS } from '../src/config/locations';
import { Location } from '../src/domain/entities/Location';
import { ScheduleEntry } from '../src/domain/entities/ScheduleEntry';
import { CelestialObject } from '../src/domain/entities/Types';
import { TIMEZONE } from '../src/config';

const DATA_DIR = path.join(__dirname, '..', 'data');

// Days in each month (non-leap year, simplistic for now)
const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function formatDate(year: number, month: number, day: number): string {
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Calculate the System Date/Time (Bolivia) for a given Target Date/Time (Location)
 */
function calculateSystemDateTime(
	targetDateStr: string,
	targetTimeStr: string,
	location: Location,
): { date: string; time: string } {
	// Parse offset strings like "UTC-7"
	const locationOffset = parseInt(location.offset.replace('UTC', ''));
	const systemOffset = parseInt(TIMEZONE.boliviaOffset.replace('UTC', ''));

	// Calculate difference: System - Location
	// e.g. (-4) - (-7) = +3 hours.
	const diffHours = systemOffset - locationOffset;

	const [year, month, day] = targetDateStr.split('-').map(Number);
	const [hour, minute] = targetTimeStr.split(':').map(Number);

	// Create Date object assuming UTC (to simplify calculation)
	const date = new Date(Date.UTC(year, month - 1, day, hour, minute));

	// Add the difference in hours
	date.setUTCHours(date.getUTCHours() + diffHours);

	// Extract components
	const sysYear = date.getUTCFullYear();
	const sysMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
	const sysDay = String(date.getUTCDate()).padStart(2, '0');
	const sysHour = String(date.getUTCHours()).padStart(2, '0');
	const sysMinute = String(date.getUTCMinutes()).padStart(2, '0');

	return {
		date: `${sysYear}-${sysMonth}-${sysDay}`,
		time: `${sysHour}:${sysMinute}`,
	};
}

function generateMonthSchedule(
	location: Location,
	object: CelestialObject,
	year: number,
	month: number,
): ScheduleEntry[] {
	const entries: ScheduleEntry[] = [];
	const days = DAYS_IN_MONTH[month];

	// Get target time from location config
	const targetTime =
		object === 'sun' ? location.sunCaptureTime : location.moonCaptureTime;

	for (let day = 1; day <= days; day++) {
		const targetDate = formatDate(year, month, day);

		// Convert to System Time (Bolivia)
		const systemDateTime = calculateSystemDateTime(
			targetDate,
			targetTime,
			location,
		);

		entries.push({
			object,
			locationId: location.id,
			date: systemDateTime.date, // System Date
			time: systemDateTime.time, // System Time
			targetDate: targetDate,    // Location Date
			targetTime: targetTime,    // Location Time
		});
	}

	return entries;
}

function saveSchedule(
	locationId: string,
	object: CelestialObject,
	year: number,
	month: number,
	entries: ScheduleEntry[],
): void {
	// New directory structure: data/{locationId}/{object}/YYYY-MM.json
	const dir = path.join(DATA_DIR, locationId, object);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	const filename = `${year}-${String(month).padStart(2, '0')}.json`;
	const filepath = path.join(dir, filename);

	const content = JSON.stringify(entries, null, 2); // Pretty print
	fs.writeFileSync(filepath, content + '\n');

	console.log(
		`  ✅ Created: data/${locationId}/${object}/${filename} (${entries.length} entries)`,
	);
}

// Generate for Feb-Dec 2026
const YEAR = 2026;

async function main() {
	console.log(`\n📅 Generating schedules for ${YEAR}...\n`);

	for (const location of LOCATIONS) {
		console.log(`📍 Location: ${location.name} (${location.offset})`);

		for (let month = 2; month <= 12; month++) {
			// Sun
			const sunEntries = generateMonthSchedule(location, 'sun', YEAR, month);
			saveSchedule(location.id, 'sun', YEAR, month, sunEntries);

			// Moon
			const moonEntries = generateMonthSchedule(location, 'moon', YEAR, month);
			saveSchedule(location.id, 'moon', YEAR, month, moonEntries);
		}
	}

	console.log('\n✨ Done!\n');
}

main().catch(console.error);
