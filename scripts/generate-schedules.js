#!/usr/bin/env npx ts-node
"use strict";
/**
 * Generate schedule files for 2026
 * - Solar: Complete with 15:30 PHX / 18:30 BOB
 * - Lunar: Template with placeholder times (00:00) for manual entry
 */
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
const DATA_DIR = path.join(__dirname, '..', 'data');
// Days in each month for 2026 (non-leap year)
const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function formatDate(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function generateSolarMonth(year, month) {
    const entries = [];
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
function generateLunarTemplate(year, month) {
    const entries = [];
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
function saveSchedule(type, year, month, entries) {
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
