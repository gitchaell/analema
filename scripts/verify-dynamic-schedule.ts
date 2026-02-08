import { ConfigScheduleRepository } from '../src/infrastructure/repositories/ConfigScheduleRepository';

async function verifyDynamicSchedule() {
    console.log('🔍 Verifying Dynamic Schedule Logic...');

    const repo = new ConfigScheduleRepository();

    // Test Date: Feb 1st, 2026
    const testDate = new Date('2026-02-01T12:00:00Z'); // Noon UTC

    // Get schedule for Phoenix
    const entries = await repo.getSchedule('phoenix', testDate);

    console.log(`📅 Test Date: ${testDate.toISOString()}`);
    console.log(`📍 Location: Phoenix`);

    if (entries.length !== 2) {
        console.error(`❌ Expected 2 entries, got ${entries.length}`);
        process.exit(1);
    }

    const sun = entries.find(e => e.object === 'sun');
    const moon = entries.find(e => e.object === 'moon');

    if (!sun || !moon) {
        console.error('❌ Missing sun or moon entry');
        process.exit(1);
    }

    // Expected:
    // Phoenix Sun: 15:30 (UTC-7) -> Bolivia: 18:30 (UTC-4) (+3h)
    // Phoenix Moon: 20:00 (UTC-7) -> Bolivia: 23:00 (UTC-4) (+3h)

    console.log(`☀️ Sun: Target ${sun.targetTime} -> System ${sun.time}`);
    console.log(`🌙 Moon: Target ${moon.targetTime} -> System ${moon.time}`);

    if (sun.time === '18:30' && moon.time === '23:00') {
        console.log('✅ Dynamic Schedule Verification PASSED');
    } else {
        console.error('❌ Dynamic Schedule Verification FAILED (Check timezone logic)');
        process.exit(1);
    }
}

verifyDynamicSchedule().catch(console.error);
