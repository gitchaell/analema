import type { CameraType } from '../../types';

export class Camera {
	constructor(
		public readonly id: string,
		public readonly url: string,
		public readonly type: CameraType,
		public readonly locationId: string,
	) {}
}
