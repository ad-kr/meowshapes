import { THREE, type Ctx } from "../index.ts";
import { BasicObject } from "./index.ts";

export class Cylinder extends BasicObject<THREE.CylinderGeometry> {
	constructor(
		ctx: Ctx,
		radiusTop: number,
		radiusBottom: number,
		height: number
	) {
		const geometry = new THREE.CylinderGeometry(
			radiusTop,
			radiusBottom,
			height
		);
		super(ctx, geometry);

		ctx.spawn(this.mesh);
	}

	/**
	 * Sets the top radius of the cylinder.
	 * @param radiusTop The new top radius of the cylinder.
	 */
	radiusTop(radiusTop: number): this {
		this.mesh.geometry = this.reconstructGeometry({ radiusTop });
		return this;
	}

	/**
	 * Sets the bottom radius of the cylinder.
	 * @param radiusBottom The new bottom radius of the cylinder.
	 */
	radiusBottom(radiusBottom: number): this {
		this.mesh.geometry = this.reconstructGeometry({ radiusBottom });
		return this;
	}

	/**
	 * Sets the height of the cylinder.
	 * @param height The new height of the cylinder.
	 */
	height(height: number): this {
		this.mesh.geometry = this.reconstructGeometry({ height });
		return this;
	}

	/**
	 * Sets the number of radial segments of the cylinder.
	 * @param segments The new number of radial segments.
	 */
	segments(segments: number): this {
		this.mesh.geometry = this.reconstructGeometry({ segments });
		return this;
	}

	private reconstructGeometry(config: {
		radiusTop?: number;
		radiusBottom?: number;
		height?: number;
		segments?: number;
	}) {
		const params = this.mesh.geometry.parameters;
		return new THREE.CylinderGeometry(
			config.radiusTop ?? params.radiusTop,
			config.radiusBottom ?? params.radiusBottom,
			config.height ?? params.height,
			config.segments ?? params.radialSegments
		);
	}
}
