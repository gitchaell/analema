import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { Scheduler } from '../../src/application/Scheduler';
import { ScheduleRepository } from '../../src/domain/repositories/ScheduleRepository';
import { CaptureService } from '../../src/domain/services/CaptureService';
import { Location } from '../../src/domain/entities/Location';
import { LOCATIONS } from '../../src/config/locations';

describe('Scheduler', () => {
    it('should trigger capture when time matches', async () => {
        // Mock dependencies
        const mockRepo: ScheduleRepository = {
            getSchedule: async (id, date) => {
                if (id === 'usa-arizona-phoenix') {
                    return [{
                        object: 'sun',
                        locationId: id,
                        date: '2026-02-01',
                        time: '18:30', // Matches mock system time
                        targetDate: '2026-02-01',
                        targetTime: '15:30'
                    }];
                }
                return [];
            }
        };

        const mockCapture: CaptureService = {
            capture: async (loc, obj) => {
                return ['path/to/file.png'];
            }
        };

        const captureSpy = mock.method(mockCapture, 'capture');

        // Create scheduler with mocked deps
        const scheduler = new Scheduler(mockRepo, mockCapture);

        // Mock Date to match 18:30 UTC-4 (which is 22:30 UTC if we assume system is UTC, but logic compares hours)
        // Scheduler logic:
        // const currentHour = now.getHours();
        // if (scheduledHour !== currentHour) continue;

        // If scheduled is 18:30.
        // We need now.getHours() to be 18.

        // Let's monkey patch Date
        const originalDate = global.Date;
        const fixedDate = new Date('2026-02-01T18:30:00'); // Local time 18:30

        class MockDate extends Date {
            constructor() {
                super();
                return fixedDate;
            }
        }
        // @ts-ignore
        global.Date = MockDate;

        try {
            // We need to override LOCATIONS to only include one for this test to be fast/deterministic?
            // The Scheduler imports LOCATIONS directly. This is hard to mock without DI of locations.
            // But LOCATIONS currently contains 'usa-arizona-phoenix'.

            await scheduler.checkAndCapture();

            assert.strictEqual(captureSpy.mock.callCount(), 1);
            const call = captureSpy.mock.calls[0];
            const locArg = call.arguments[0] as Location;
            const objArg = call.arguments[1];

            assert.strictEqual(locArg.id, 'usa-arizona-phoenix');
            assert.strictEqual(objArg, 'sun');

        } finally {
            // @ts-ignore
            global.Date = originalDate;
        }
    });
});
