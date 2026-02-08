import { slugify } from '../../utils/slugify';
import { Camera } from './Camera';

export class Location {
	public readonly id: string;
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
		this.id = slugify(`${country}-${state}-${city}`);
		this.name = `${city}, ${state}, ${country}`;
	}
}
