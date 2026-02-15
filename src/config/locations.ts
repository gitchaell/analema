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
		'17:30',
		'23:30',
		[
			new Camera('west', 'https://myearthcam.com/insideoutaerial'),
			new Camera('north', 'https://www.myearthcam.com/insideoutaerial/lowercam2'),
			new Camera('northeast', 'https://www.myearthcam.com/insideoutaerial/lowercam3'),
			new Camera('multiple', 'https://www.myearthcam.com/insideoutaerial/phxweather'),
		],
	),
	new Location(
		'America/New_York',
		'UTC-5',
		'USA',
		'Florida',
		'Englewood Beach',
		'17:30',
		'01:00',
		[
			new Camera('unknown', 'https://www.earthcam.com/usa/florida/portcharlotte/?cam=englewoodbeach'),
		],
	),
	new Location(
		'America/Los_Angeles',
		'UTC-8',
		'USA',
		'California',
		'Ojai',
		'14:00',
		'20:50',
		[
			new Camera('unknown', 'https://www.earthcam.com/usa/california/ojai/?cam=ojaivalley'),
		],
	),
	new Location(
		'America/New_York',
		'UTC-5',
		'USA',
		'Maine',
		'Peaks Island',
		'15:30',
		'06:00',
		[
			new Camera('unknown', 'https://www.earthcam.com/usa/maine/peaksisland/?cam=peaksisland'),
		],
	),
	new Location(
		'America/Phoenix',
		'UTC-7',
		'USA',
		'Arizona',
		'Prescott',
		'18:40',
		'08:20',
		[
			new Camera('unknown', 'https://www.earthcam.com/usa/arizona/prescott/?cam=prescott'),
		],
	),
	new Location(
		'America/Phoenix',
		'UTC-7',
		'USA',
		'Arizona',
		'Fountain Hills',
		'11:00',
		'23:30',
		[
			new Camera('unknown', 'https://www.earthcam.com/usa/arizona/fountainhills/?cam=fountainpark'),
		],
	),
];


