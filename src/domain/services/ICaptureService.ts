import type { CaptureType } from '../../types';
import type { Camera } from '../entities/Camera';
import type { Location } from '../entities/Location';

export interface ICaptureService {
	/**
	 * Capture screenshots from multiple cameras for a specific location and type
	 */
	capture(location: Location, cameras: Camera[], type: CaptureType): Promise<string[]>;
}
