#!/usr/bin/env npx ts-node
/**
 * Generate schedule files for 2026
 * - Solar: Complete with 15:30 PHX / 18:30 BOB
 * - Lunar: Template with placeholder times (00:00) for manual entry
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const DATA_DIR = path.join(__dirname, '..', 'data');

// Days in each month for 2026 (non-leap year)
const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

interface ScheduleEntry {
	'phx.date': string;
	'phx.time': string;
	'bob.date': string;
	'bob.time': string;
}

function formatDate(year: number, month: number, day: number): string {
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function generateSolarMonth(year: number, month: number): ScheduleEntry[] {
	const entries: ScheduleEntry[] = [];
	const days = DAYS_IN_MONTH[month];

	for (let day = 1; day <= days; day++) {
		const date = formatDate(year, month, day);
		entries.push({
			'phx.date': date,
			'phx.time': '15:30',
			'bob.date': date,
			'bob.time': '18:30',
		});
	}

	return entries;
}

function generateLunarTemplate(year: number, month: number): ScheduleEntry[] {
	const entries: ScheduleEntry[] = [];
	const days = DAYS_IN_MONTH[month];

	for (let day = 1; day <= days; day++) {
		const date = formatDate(year, month, day);
		entries.push({
			'phx.date': date,
			'phx.time': '00:00', // Placeholder - fill manually
			'bob.date': date,
			'bob.time': '00:00', // Placeholder - fill manually
		});
	}

	return entries;
}

function saveSchedule(type: 'solar' | 'lunar', year: number, month: number, entries: ScheduleEntry[]): void {
	const dir = path.join(DATA_DIR, type);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	const filename = `${year}-${String(month).padStart(2, '0')}.json`;
	const filepath = path.join(dir, filename);

	// Compact format (no tabs/newlines)
	const content = JSON.stringify(entries);
	fs.writeFileSync(filepath, content + '\n');

	console.log(`  ✅ Created: data/${type}/${filename} (${entries.length} entries)`);
}

// Generate for Feb-Dec 2026 (Jan already exists)
console.log('\n🌞 Generating SOLAR schedules (Feb-Dec 2026)...\n');
for (let month = 2; month <= 12; month++) {
	const entries = generateSolarMonth(2026, month);
	saveSchedule('solar', 2026, month, entries);
}

console.log('\n🌙 Generating LUNAR templates (Feb-Dec 2026)...\n');
console.log('   ⚠️  Lunar times are placeholders (00:00) - fill manually!\n');
for (let month = 2; month <= 12; month++) {
	const entries = generateLunarTemplate(2026, month);
	saveSchedule('lunar', 2026, month, entries);
}

console.log('\n✨ Done!\n');
