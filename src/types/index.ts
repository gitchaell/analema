/**
 * =============================================================================
 * ANALEMA SOLAR Y LUNAR - Type Definitions
 * =============================================================================
 */

/** Camera type - north, northeast, southeast, or west */
export type CameraType = 'north' | 'northeast' | 'southeast' | 'west';

/** Capture type - solar or lunar */
export type CaptureType = 'solar' | 'lunar';

/**
 * A single schedule entry from the JSON files
 */
export interface ScheduleEntry {
	date: string; // Format: YYYY-MM-DD (Bolivia date)
	time: string; // Format: HH:MM (24-hour, Bolivian time)
	camera?: CameraType; // Optional - if omitted, capture all cameras
	phoenix_time?: string; // Original Phoenix time
	phoenix_date?: string; // Phoenix date if different from Bolivia date (crosses midnight)
	illumination?: string; // For lunar entries
	notes?: string;
}

/**
 * Structure of a schedule JSON file (solar or lunar)
 */
export interface ScheduleFile {
	type: CaptureType;
	description: string;
	timezone: {
		display: string;
		target_location: string;
		offset_difference: string;
	};
	capture_window_bolivia_time?: {
		start: string;
		end: string;
	};
	schedule: ScheduleEntry[];
}

/**
 * Combined entry with type information for processing
 */
export interface CombinedEntry extends ScheduleEntry {
	type: CaptureType;
}

/**
 * Result from finding a scheduled capture
 */
export interface ScheduledCapture {
	entry: CombinedEntry;
	waitMs: number;
}
