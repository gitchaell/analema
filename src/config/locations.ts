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
		'15:30', // Sun capture time (local)
		'20:00', // Moon capture time (local)
		[
			new Camera(
				'https://myearthcam.com/insideoutaerial',
				'west',
			),
			new Camera(
				'https://www.myearthcam.com/insideoutaerial/lowercam2',
				'north',
			),
			new Camera(
				'https://www.myearthcam.com/insideoutaerial/lowercam3',
				'northeast',
			),
			new Camera(
				'https://www.myearthcam.com/insideoutaerial/phxweather',
				'multiple',
			),
		],
	),
];
