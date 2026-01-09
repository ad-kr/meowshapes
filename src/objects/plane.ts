import { THREE, type Ctx } from "../index.ts";
import { BasicObject } from "./index.ts";

export class Plane extends BasicObject<THREE.PlaneGeometry> {
	constructor(ctx: Ctx, width: number, height: number) {
		const geometry = new THREE.PlaneGeometry(width, height);
		super(ctx, geometry);

		ctx.spawn(this.mesh);
	}

	/**
	 * Sets the width of the plane.
	 * @param width The new width of the plane.
	 */
	width(width: number): this {
		this.mesh.geometry = this.reconstructGeometry({ width });
		return this;
	}

	/**
	 * Sets the height of the plane.
	 * @param height The new height of the plane.
	 */
	height(height: number): this {
		this.mesh.geometry = this.reconstructGeometry({ height });
		return this;
	}

	private reconstructGeometry(config: { width?: number; height?: number }) {
		const params = this.mesh.geometry.parameters;
		return new THREE.PlaneGeometry(
			config.width ?? params.width,
			config.height ?? params.height
		);
	}
}
