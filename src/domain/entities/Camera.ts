import { CameraDirection } from './Types';

export class Camera {
	constructor(
		public readonly id: string,
		public readonly url: string,
		public readonly direction: CameraDirection,
	) {}
}
