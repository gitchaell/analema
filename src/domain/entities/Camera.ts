import { CameraDirection } from './Types';

export class Camera {
	public readonly id: string;

	constructor(
		public readonly url: string,
		public readonly direction: CameraDirection,
	) {
		this.id = direction;
	}
}
