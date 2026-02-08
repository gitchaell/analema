import * as fs from 'node:fs';
import * as path from 'node:path';
import { ConfigScheduleRepository } from '../src/infrastructure/repositories/ConfigScheduleRepository';
import { LOCATIONS } from '../src/config/locations';
import { ScheduleEntry } from '../src/domain/entities/ScheduleEntry';

function formatICSDate(date: string, time: string): string {
	const [year, month, day] = date.split('-');
	const [hour, min] = time.split(':');
	return `${year}${month}${day}T${hour}${min}00`;
}

function generateUID(date: string, time: string, type: string, locationId: string): string {
	return `${date}-${time.replace(':', '')}-${type}-${locationId}@analema`;
}

async function generateICS(): Promise<string> {
	const icsContent = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Analema Sky Photographer//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'X-WR-CALNAME:Analema Captures 2026',
		'X-WR-TIMEZONE:America/La_Paz',
	];

    const repository = new ConfigScheduleRepository();
    const YEAR = 2026;
    const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

	for (const location of LOCATIONS) {
        console.log(`Generating events for ${location.name} (ID: ${location.id})...`);

        // Loop through the whole year
        for (let month = 1; month <= 12; month++) {
            const days = DAYS_IN_MONTH[month];

            for (let day = 1; day <= days; day++) {
                const date = new Date(Date.UTC(YEAR, month - 1, day, 12, 0, 0));

                const entries = await repository.getSchedule(location.id, date);

                for (const entry of entries) {
                    const object = entry.object;
                    const emoji = object === 'sun' ? '☀️' : '🌙';
                    const summary = `${emoji} ${object.charAt(0).toUpperCase() + object.slice(1)} Capture (${location.id})`;

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
                        `UID:${generateUID(entry.date, entry.time, object, location.id)}`,
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

generateICS().then(ics => {
    const outputPath = path.join(__dirname, '..', 'analema-2026.ics');
    fs.writeFileSync(outputPath, ics);
    console.log(`✅ Calendar generated: ${outputPath}`);
    console.log(`   Import this file to Google Calendar`);
}).catch(console.error);
