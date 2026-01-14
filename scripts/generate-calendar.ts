import * as fs from 'node:fs';
import * as path from 'node:path';

interface ScheduleEntry {
	'phx.date': string;
	'phx.time': string;
	'bob.date': string;
	'bob.time': string;
}

function formatICSDate(date: string, time: string): string {
	const [year, month, day] = date.split('-');
	const [hour, min] = time.split(':');
	return `${year}${month}${day}T${hour}${min}00`;
}

function generateUID(date: string, time: string, type: string): string {
	return `${date}-${time.replace(':', '')}-${type}@analema`;
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

	const types = ['solar', 'lunar'] as const;

	for (const type of types) {
		const typeDir = path.join(dataDir, type);
		if (!fs.existsSync(typeDir)) continue;

		// Find all YYYY-MM.json files
		const files = fs.readdirSync(typeDir).filter((f) => f.match(/^\d{4}-\d{2}\.json$/));

		for (const file of files) {
			const filePath = path.join(typeDir, file);
			const entries: ScheduleEntry[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

			for (const entry of entries) {
				// Skip placeholder entries (00:00)
				if (entry['bob.time'] === '00:00') continue;

				const emoji = type === 'solar' ? '☀️' : '🌙';
				const summary = `${emoji} ${type.charAt(0).toUpperCase() + type.slice(1)} Capture`;
				const description = `Phoenix: ${entry['phx.date']} ${entry['phx.time']}`;

				const dtstart = formatICSDate(entry['bob.date'], entry['bob.time']);
				const [h, m] = entry['bob.time'].split(':').map(Number);
				const endMin = m + 5;
				const endHour = endMin >= 60 ? h + 1 : h;
				const endMinFinal = endMin % 60;
				const dtend = formatICSDate(
					entry['bob.date'],
					`${String(endHour).padStart(2, '0')}:${String(endMinFinal).padStart(2, '0')}`,
				);

				icsContent.push(
					'BEGIN:VEVENT',
					`UID:${generateUID(entry['bob.date'], entry['bob.time'], type)}`,
					`DTSTAMP:${formatICSDate('2026-01-14', '12:00')}Z`,
					`DTSTART;TZID=America/La_Paz:${dtstart}`,
					`DTEND;TZID=America/La_Paz:${dtend}`,
					`SUMMARY:${summary}`,
					`DESCRIPTION:${description}`,
					type === 'solar' ? 'CATEGORIES:Solar' : 'CATEGORIES:Lunar',
					'END:VEVENT',
				);
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
