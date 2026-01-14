/**
 * =============================================================================
 * ANALEMA SOLAR Y LUNAR - Type Definitions
 * =============================================================================
 */

/** Camera type - north, northeast, multiple (4-view), or west */
export type CameraType = 'north' | 'northeast' | 'multiple' | 'west';

/** Capture type - solar or lunar */
export type CaptureType = 'solar' | 'lunar';

/**
 * A single schedule entry from the JSON files
 * Uses the new simplified format with phx (Phoenix) and bob (Bolivia) times
 */
export interface ScheduleEntry {
	'phx.date': string; // Phoenix date (YYYY-MM-DD)
	'phx.time': string; // Phoenix time (HH:MM)
	'bob.date': string; // Bolivia date (YYYY-MM-DD)
	'bob.time': string; // Bolivia time (HH:MM)
}

/**
 * Combined entry with type information for processing
 */
export interface CombinedEntry {
	type: CaptureType;
	date: string; // Bolivia date
	time: string; // Bolivia time
	phoenixDate: string;
	phoenixTime: string;
}

/**
 * Result from finding a scheduled capture
 */
export interface ScheduledCapture {
	entry: CombinedEntry;
	waitMs: number;
}
