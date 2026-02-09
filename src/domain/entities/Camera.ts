import type { CameraDirection } from './Types';

export class Camera {
	constructor(
		public readonly direction: CameraDirection,
		public readonly url: string,
	) { }
}
