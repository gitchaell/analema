import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { Scheduler } from '../../src/application/Scheduler';

describe('Timezone Edge Cases', () => {

	it('should catch events shifted to yesterday/tomorrow system time', async () => {
		// Setup dates
		// System Time: Feb 8, 21:00 UTC
		const systemTime = new Date('2026-02-08T21:00:00Z');

		// Mock Repository
		const mockRepo = {
			getSchedule: async (locationId: string, date: Date) => {
				const dateStr = date.toISOString().split('T')[0];
				if (dateStr === '2026-02-09') { // "Tomorrow"
					return [{
						object: 'sun' as const,
						location: { id: 'tokyo', name: 'Tokyo' } as any,
						date: '2026-02-08', // The system date where this event falls
						time: '21:00',      // The system time where this event falls
						targetDate: '2026-02-09',
						targetTime: '10:00'
					}];
				}
				return [];
			}
		};

		const mockCapture = {
			capture: mock.fn(async () => [])
		};
		const captureSpy = mockCapture.capture;

		const scheduler = new Scheduler(mockRepo as any, mockCapture as any);

		// Monkey patch Date
		const originalDate = global.Date;
		class MockDate extends Date {
			constructor(date?: string | number | Date) {
				super(date || systemTime);
				return new originalDate(date || systemTime);
			}
		}
		// @ts-ignore
		global.Date = MockDate;

		try {
			// Spy on getSchedule
			const spy = mock.method(mockRepo, 'getSchedule');

			await scheduler.checkAndCapture();

			const calls = spy.mock.calls;
			const datesCalled = calls.map(c => (c.arguments[1] as Date).toISOString().split('T')[0]);

			console.log('Dates checked:', datesCalled);

			assert.ok(datesCalled.some(d => d === '2026-02-07'), `Should check yesterday (Found: ${datesCalled.join(', ')})`);
			assert.ok(datesCalled.some(d => d === '2026-02-08'), `Should check today (Found: ${datesCalled.join(', ')})`);
			assert.ok(datesCalled.some(d => d === '2026-02-09'), `Should check tomorrow (Found: ${datesCalled.join(', ')})`);

			// Verify capture was triggered for the event found on "tomorrow"
			assert.strictEqual(captureSpy.mock.callCount(), 1);
			const call = captureSpy.mock.calls[0];
			const args = call.arguments as unknown as [any, any];
			assert.strictEqual(args[1], 'sun');

		} finally {
			// @ts-ignore
			global.Date = originalDate;
		}
	});

});
