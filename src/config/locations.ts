import { Camera } from '../domain/entities/Camera';
import { Location } from '../domain/entities/Location';

/**
 * Fixed time for Lunar captures (Bolivia time)
 * Format: HH:MM
 */
export const FIXED_LUNAR_TIME = '20:00';

/**
 * Registry of available locations
 */
export const LOCATIONS: Location[] = [
	new Location('phoenix', 'Ahwatukee - Phoenix', 'America/Phoenix', 'UTC-7'),
];

/**
 * Registry of cameras per location
 */
const CAMERA_REGISTRY: Camera[] = [
	new Camera('west', 'https://myearthcam.com/insideoutaerial', 'west', 'phoenix'),
	new Camera('north', 'https://www.myearthcam.com/insideoutaerial/lowercam2', 'north', 'phoenix'),
	new Camera(
		'northeast',
		'https://www.myearthcam.com/insideoutaerial/lowercam3',
		'northeast',
		'phoenix',
	),
	new Camera(
		'multiple',
		'https://www.myearthcam.com/insideoutaerial/phxweather',
		'multiple',
		'phoenix',
	),
];

/**
 * Get all cameras for a specific location
 */
export function getCamerasForLocation(locationId: string): Camera[] {
	return CAMERA_REGISTRY.filter((camera) => camera.locationId === locationId);
}
