export class Location {
	constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly timezone: string,
		public readonly offset: string,
	) {}
}
