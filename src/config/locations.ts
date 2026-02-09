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
		'12:28', // Solar Noon (UTC-7)
		'00:28', // Solar Midnight (UTC-7)
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
		'12:29', // Solar Noon (UTC-5)
		'00:29', // Solar Midnight (UTC-5)
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
		'11:56', // Solar Noon (UTC-8)
		'23:56', // Solar Midnight (UTC-8)
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
		'11:40', // Solar Noon (UTC-5)
		'23:40', // Solar Midnight (UTC-5)
		[
			new Camera('unknown', 'https://www.earthcam.com/usa/maine/peaksisland/?cam=peaksisland#google_vignette'),
		],
	),
	new Location(
		'America/Phoenix',
		'UTC-7',
		'USA',
		'Arizona',
		'Prescott',
		'12:29', // Solar Noon (UTC-7)
		'00:29', // Solar Midnight (UTC-7)
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
		'12:26', // Solar Noon (UTC-7)
		'00:26', // Solar Midnight (UTC-7)
		[
			new Camera('unknown', 'https://www.earthcam.com/usa/arizona/fountainhills/?cam=fountainpark'),
		],
	),
];


