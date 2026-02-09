import { Camera } from '../domain/entities/Camera';
import { Location } from '../domain/entities/Location';

/**
 * Registry of available locations
 */
export const LOCATIONS: Location[] = [
	new Location(
		'America/Phoenix',
		'UTC-7',
		'USA',
		'Arizona',
		'Phoenix',
		'16:00', // Sun capture time (phoenix timezone)
		'21:00', // Moon capture time (phoenix timezone)
		[
			new Camera('west', 'https://myearthcam.com/insideoutaerial'),
			new Camera('north', 'https://www.myearthcam.com/insideoutaerial/lowercam2'),
			new Camera('northeast', 'https://www.myearthcam.com/insideoutaerial/lowercam3'),
			new Camera('multiple', 'https://www.myearthcam.com/insideoutaerial/phxweather'),
		],
	),
];
