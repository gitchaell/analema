import { slugify } from '../../utils/slugify';
import type { Camera } from './Camera';
import type { LocationId } from './Types';

export class Location {
	public readonly id: LocationId;
	public readonly name: string;

	constructor(
		public readonly timezone: string,
		public readonly offset: string,
		public readonly country: string,
		public readonly state: string,
		public readonly city: string,
		public readonly sunCaptureTime: string,
		public readonly moonCaptureTime: string,
		public readonly cameras: Camera[],
	) {
		this.id = slugify(`${country}-${state}-${city}`) as LocationId;
		this.name = `${city}, ${state}, ${country}`;
	}
}
