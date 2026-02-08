import { Location } from '../entities/Location';
import { CelestialObject } from '../entities/Types';

export interface CaptureService {
	/**
	 * Capture screenshots from multiple cameras for a specific location and object type
	 */
	capture(
		location: Location,
		object: CelestialObject,
	): Promise<string[]>;
}
