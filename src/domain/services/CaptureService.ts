import type { Location } from '../entities/Location';
import type { CelestialObject } from '../entities/Types';

export interface CaptureService {
	/**
	 * Capture screenshots from multiple cameras for a specific location and object type
	 */
	capture(location: Location, object: CelestialObject): Promise<string[]>;
}
