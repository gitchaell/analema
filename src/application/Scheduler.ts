import { STREAM_LOAD_WAIT_MS } from '../config';
import { LOCATIONS } from '../config/locations';
import { Location } from '../domain/entities/Location';
import { ScheduleEntry } from '../domain/entities/ScheduleEntry';
import { ScheduleRepository } from '../domain/repositories/ScheduleRepository';
import { CaptureService } from '../domain/services/CaptureService';
import { Logger } from '../utils/Logger';

export class Scheduler {
	constructor(
		private scheduleRepository: ScheduleRepository,
		private captureService: CaptureService,
	) {}

	/**
	 * Check schedules for all locations and trigger captures if needed
	 */
	async checkAndCapture(): Promise<void> {
		const now = new Date();

		Logger.log(`📅 System time: ${now.toString()}`);
		Logger.log(`🔍 Checking schedules for ${LOCATIONS.length} locations...`);

		const promises = LOCATIONS.map(async (location) => {
			try {
				const schedule = await this.scheduleRepository.getSchedule(
					location.id,
					now,
				);

				const scheduledCapture = this.findScheduledCaptureThisWindow(
					schedule,
					now,
				);

				if (scheduledCapture) {
					const { entry, totalWaitMs } = scheduledCapture;
					Logger.success(
						`✅ [${location.name}] Found scheduled capture: ${entry.object} at ${entry.time}`,
					);

					await this.executeCapture(location, entry, totalWaitMs);
				} else {
					Logger.log(`   [${location.name}] No capture scheduled this hour.`);
				}
			} catch (error) {
				Logger.error(`Error checking schedule for ${location.name}: ${error}`);
			}
		});

		await Promise.all(promises);
	}

	private findScheduledCaptureThisWindow(
		schedule: ScheduleEntry[],
		now: Date,
	): { entry: ScheduleEntry; totalWaitMs: number } | null {
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const currentDate = `${year}-${month}-${day}`;

		const currentHour = now.getHours();

		for (const entry of schedule) {
			// Check date
			if (entry.date !== currentDate) continue;

			// Check hour
			const [scheduledHour, scheduledMinute] = entry.time
				.split(':')
				.map(Number);
			if (scheduledHour !== currentHour) continue;

			// Calculate wait time
			const scheduledTime = new Date(now);
			scheduledTime.setHours(scheduledHour, scheduledMinute, 0, 0);
			const totalWaitMs = scheduledTime.getTime() - now.getTime();

			// If wait time is negative (already passed), but still in same hour/minute window?
			// The original code uses Math.max(0, waitMs).
			// If it's passed, it captures immediately.
			return { entry, totalWaitMs: Math.max(0, totalWaitMs) };
		}

		return null;
	}

	private async executeCapture(
		location: Location,
		entry: ScheduleEntry,
		totalWaitMs: number,
	): Promise<void> {
		// Calculate start time based on stream load wait
		// We want to snap exactly at 'entry.time'.
		// CaptureService takes 'STREAM_LOAD_WAIT_MS' to load stream before snapping.
		// So we must start CaptureService at (entry.time - STREAM_LOAD_WAIT_MS).

		const startCaptureInMs = Math.max(0, totalWaitMs - STREAM_LOAD_WAIT_MS);

		Logger.log(`⏱️  TIMING CALCULATION for ${location.name}`);
		Logger.log(`   Scheduled time: ${entry.time}`);
		Logger.log(`   Time until shot: ${Math.round(totalWaitMs / 60000)} min`);
		Logger.log(
			`   Stream load time: ${Math.round(STREAM_LOAD_WAIT_MS / 60000)} min`,
		);
		Logger.log(
			`   Start browser in: ${Math.round(startCaptureInMs / 60000)} min`,
		);

		if (startCaptureInMs > 0) {
			const waitMinutes = Math.round(startCaptureInMs / 60000);
			Logger.log(
				`⏳ Waiting ${waitMinutes} minutes before launching browsers...`,
			);
			await new Promise((resolve) => setTimeout(resolve, startCaptureInMs));
		}

		// Now trigger the service
		// The service will launch browser, wait STREAM_LOAD_WAIT_MS, then snap.
		await this.captureService.capture(location, entry.object);
	}
}
