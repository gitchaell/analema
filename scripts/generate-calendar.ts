import * as fs from 'node:fs';
import * as path from 'node:path';

interface ScheduleEntry {
	date: string;
	time: string;
	phoenix_time?: string;
	illumination?: string;
}

interface ScheduleFile {
	type: string;
	schedule: ScheduleEntry[];
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

	const types = ['solar', 'lunar'];

	for (const type of types) {
		const typeDir = path.join(dataDir, type);
		if (!fs.existsSync(typeDir)) continue;

		const months = fs.readdirSync(typeDir).filter(d => d.match(/^\d{4}-\d{2}$/));

		for (const month of months) {
			const scheduleFile = path.join(typeDir, month, 'schedule.json');
			if (!fs.existsSync(scheduleFile)) continue;

			const data: ScheduleFile = JSON.parse(fs.readFileSync(scheduleFile, 'utf-8'));

			for (const entry of data.schedule) {
				const emoji = type === 'solar' ? '☀️' : '🌙';
				const summary = `${emoji} ${type.charAt(0).toUpperCase() + type.slice(1)} Capture`;
				const description = entry.illumination
					? `Moon illumination: ${entry.illumination}\\nPhoenix time: ${entry.phoenix_time}`
					: `Phoenix time: ${entry.phoenix_time}`;

				const dtstart = formatICSDate(entry.date, entry.time);
				const [h, m] = entry.time.split(':').map(Number);
				const endMin = m + 5;
				const endHour = endMin >= 60 ? h + 1 : h;
				const endMinFinal = endMin % 60;
				const dtend = formatICSDate(entry.date, `${String(endHour).padStart(2, '0')}:${String(endMinFinal).padStart(2, '0')}`);

				icsContent.push(
					'BEGIN:VEVENT',
					`UID:${generateUID(entry.date, entry.time, type)}`,
					`DTSTAMP:${formatICSDate('2026-01-12', '12:00')}Z`,
					`DTSTART;TZID=America/La_Paz:${dtstart}`,
					`DTEND;TZID=America/La_Paz:${dtend}`,
					`SUMMARY:${summary}`,
					`DESCRIPTION:${description}`,
					type === 'solar' ? 'CATEGORIES:Solar' : 'CATEGORIES:Lunar',
					'END:VEVENT'
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
