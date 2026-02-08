import * as fs from 'node:fs';
import * as path from 'node:path';
import { ScheduleEntry } from '../src/domain/entities/ScheduleEntry';

function formatICSDate(date: string, time: string): string {
	const [year, month, day] = date.split('-');
	const [hour, min] = time.split(':');
	return `${year}${month}${day}T${hour}${min}00`;
}

function generateUID(date: string, time: string, type: string, locationId: string): string {
	return `${date}-${time.replace(':', '')}-${type}-${locationId}@analema`;
}

function generateICS(): string {
	const dataDir = path.join(__dirname, '..', 'data');

	const icsContent = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Analema Sky Photographer//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'X-WR-CALNAME:Analema Captures 2026',
		'X-WR-TIMEZONE:America/La_Paz',
	];

	// Iterate through all locations in dataDir
	if (!fs.existsSync(dataDir)) return '';
	const locations = fs.readdirSync(dataDir).filter(f => fs.statSync(path.join(dataDir, f)).isDirectory());

	const objects = ['sun', 'moon'] as const;

	for (const locationId of locations) {
		for (const object of objects) {
			const typeDir = path.join(dataDir, locationId, object);
			if (!fs.existsSync(typeDir)) continue;

			// Find all YYYY-MM.json files
			const files = fs.readdirSync(typeDir).filter((f) => f.match(/^\d{4}-\d{2}\.json$/));

			for (const file of files) {
				const filePath = path.join(typeDir, file);
				const entries: ScheduleEntry[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

				for (const entry of entries) {
					const emoji = object === 'sun' ? '☀️' : '🌙';
					const summary = `${emoji} ${object.charAt(0).toUpperCase() + object.slice(1)} Capture (${locationId})`;

					// Description showing Target Time (Location) vs System Time (Bolivia)
					const description = `Target: ${entry.targetDate} ${entry.targetTime}\nSystem: ${entry.date} ${entry.time}`;

					const dtstart = formatICSDate(entry.date, entry.time);
					const [h, m] = entry.time.split(':').map(Number);
					const endMin = m + 5;
					const endHour = endMin >= 60 ? h + 1 : h;
					const endMinFinal = endMin % 60;
					const dtend = formatICSDate(
						entry.date,
						`${String(endHour).padStart(2, '0')}:${String(endMinFinal).padStart(2, '0')}`,
					);

					icsContent.push(
						'BEGIN:VEVENT',
						`UID:${generateUID(entry.date, entry.time, object, locationId)}`,
						`DTSTAMP:${formatICSDate('2026-01-01', '12:00')}Z`, // Simplified stamp
						`DTSTART;TZID=America/La_Paz:${dtstart}`,
						`DTEND;TZID=America/La_Paz:${dtend}`,
						`SUMMARY:${summary}`,
						`DESCRIPTION:${description}`,
						object === 'sun' ? 'CATEGORIES:Solar' : 'CATEGORIES:Lunar',
						'END:VEVENT',
					);
				}
			}
		}
	}

	icsContent.push('END:VCALENDAR');
	return icsContent.join('\r\n');
}

const ics = generateICS();
const outputPath = path.join(__dirname, '..', 'analema-2026.ics');
fs.writeFileSync(outputPath, ics);
console.log(`✅ Calendar generated: ${outputPath}`);
console.log(`   Import this file to Google Calendar`);
