import assert from 'node:assert';
import { describe, it } from 'node:test';
import { ConfigScheduleRepository } from '../../src/infrastructure/repositories/ConfigScheduleRepository';

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

		const sun = entries.find(entry => entry.object === 'sun');
		const moon = entries.find(entry => entry.object === 'moon');

		assert.ok(sun);
		assert.ok(moon);

		// Verify conversion: 16:00 (UTC-7) -> 19:00 (UTC-4)
		assert.strictEqual(sun?.targetTime, '16:00');
		assert.strictEqual(sun?.time, '19:00');

		// Verify conversion: 21:00 (UTC-7) -> 00:00 (next day in UTC-4?)
		// Wait, 21:00 UTC-7 is 04:00 UTC next day, which is 00:00 UTC-4 next day.
		// Let's check the actual output from previous test run if possible, or calculate it.
		// Previous test run said:
		// [08/02/2026, 21:28:10]          - sun at 19:00 (Target: 16:00)
		// [08/02/2026, 21:28:10]          - moon at 00:00 (Target: 21:00)

		assert.strictEqual(moon?.targetTime, '21:00');
		assert.strictEqual(moon?.time, '00:00');

		// Verify location object
		assert.strictEqual(sun?.location.city, 'Phoenix');
		assert.strictEqual(moon?.location.id, 'usa-arizona-phoenix');
	});

	it('should return empty array for unknown location', async () => {
		const entries = await repo.getSchedule('unknown-location' as any, new Date());
		assert.strictEqual(entries.length, 0);
	});
});
