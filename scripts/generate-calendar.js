"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
function formatICSDate(date, time) {
    const [year, month, day] = date.split('-');
    const [hour, min] = time.split(':');
    return `${year}${month}${day}T${hour}${min}00`;
}
function generateUID(date, time, type) {
    return `${date}-${time.replace(':', '')}-${type}@analema`;
}
function generateICS() {
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
        if (!fs.existsSync(typeDir))
            continue;
        // Find all YYYY-MM.json files
        const files = fs.readdirSync(typeDir).filter((f) => f.match(/^\d{4}-\d{2}\.json$/));
        for (const file of files) {
            const filePath = path.join(typeDir, file);
            const entries = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            for (const entry of entries) {
                // Skip placeholder entries (00:00)
                if (entry['bob.time'] === '00:00')
                    continue;
                const emoji = type === 'solar' ? '☀️' : '🌙';
                const summary = `${emoji} ${type.charAt(0).toUpperCase() + type.slice(1)} Capture`;
                const description = `Phoenix: ${entry['phx.date']} ${entry['phx.time']}`;
                const dtstart = formatICSDate(entry['bob.date'], entry['bob.time']);
                const [h, m] = entry['bob.time'].split(':').map(Number);
                const endMin = m + 5;
                const endHour = endMin >= 60 ? h + 1 : h;
                const endMinFinal = endMin % 60;
                const dtend = formatICSDate(entry['bob.date'], `${String(endHour).padStart(2, '0')}:${String(endMinFinal).padStart(2, '0')}`);
                icsContent.push('BEGIN:VEVENT', `UID:${generateUID(entry['bob.date'], entry['bob.time'], type)}`, `DTSTAMP:${formatICSDate('2026-01-14', '12:00')}Z`, `DTSTART;TZID=America/La_Paz:${dtstart}`, `DTEND;TZID=America/La_Paz:${dtend}`, `SUMMARY:${summary}`, `DESCRIPTION:${description}`, type === 'solar' ? 'CATEGORIES:Solar' : 'CATEGORIES:Lunar', 'END:VEVENT');
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
