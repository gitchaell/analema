export class Location {
	constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly timezone: string,
		public readonly offset: string,
		public readonly country: string,
		public readonly state: string,
		public readonly city: string,
		public readonly sunCaptureTime: string,
		public readonly moonCaptureTime: string,
	) {}
}
