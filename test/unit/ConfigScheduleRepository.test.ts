import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ConfigScheduleRepository } from '../../src/infrastructure/repositories/ConfigScheduleRepository';
import { LOCATIONS } from '../../src/config/locations';

// We can mock LOCATIONS if we want to be pure, but integration with config is also fine here.
// For unit test purity, we might want to mock the imported LOCATIONS, but TS/ESM mocking is tricky without a framework.
// We will test the logic assuming the Phoenix location exists in config.

describe('ConfigScheduleRepository', () => {
    const repo = new ConfigScheduleRepository();

    it('should return correct schedule entries for Phoenix', async () => {
        // Test Date: Feb 1st, 2026 12:00 UTC
        const testDate = new Date('2026-02-01T12:00:00Z');

        // Use the ID we know exists (usa-arizona-phoenix)
        // Wait, did we update config/locations.ts to use the new ID?
        // The config/locations.ts currently uses 'Phoenix' as city, 'Arizona' as state, 'USA' as country.
        // So ID should be 'usa-arizona-phoenix'.

        const entries = await repo.getSchedule('usa-arizona-phoenix', testDate);

        assert.strictEqual(entries.length, 2);

        const sun = entries.find(e => e.object === 'sun');
        const moon = entries.find(e => e.object === 'moon');

        assert.ok(sun);
        assert.ok(moon);

        // Verify conversion: 15:30 (UTC-7) -> 18:30 (UTC-4)
        assert.strictEqual(sun?.targetTime, '15:30');
        assert.strictEqual(sun?.time, '18:30');

        // Verify conversion: 20:00 (UTC-7) -> 23:00 (UTC-4)
        assert.strictEqual(moon?.targetTime, '20:00');
        assert.strictEqual(moon?.time, '23:00');
    });

    it('should return empty array for unknown location', async () => {
        const entries = await repo.getSchedule('unknown-location', new Date());
        assert.strictEqual(entries.length, 0);
    });
});
