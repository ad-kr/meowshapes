import { Ctx, THREE } from "../index.ts";
import { BasicObject } from "./index.ts";

/**
 * Class representing a 3D cone object.
 */
export class Cone extends BasicObject<THREE.ConeGeometry> {
	constructor(ctx: Ctx, radius: number, height: number) {
		const geometry = new THREE.ConeGeometry(radius, height);
		super(ctx, geometry);

		ctx.spawn(this.mesh);
	}

	/**
	 * Sets the radius of the cone.
	 * @param radius The new radius of the cone.
	 */
	radius(radius: number): this {
		this.mesh.geometry = this.reconstructGeometry({ radius });
		return this;
	}

	/**
	 * Sets the height of the cone.
	 * @param height The new height of the cone.
	 */
	height(height: number): this {
		this.mesh.geometry = this.reconstructGeometry({ height });
		return this;
	}

	/**
	 * Sets the amount of radial segments.
	 * @param radialSegments Radial segments
	 */
	segments(radialSegments: number): this {
		this.mesh.geometry = this.reconstructGeometry({
			radialSegments,
		});
		return this;
	}

	private reconstructGeometry(config: {
		radius?: number;
		height?: number;
		radialSegments?: number;
	}) {
		const params = this.mesh.geometry.parameters;
		return new THREE.ConeGeometry(
			config.radius ?? params.radius,
			config.height ?? params.height,
			config.radialSegments ?? params.radialSegments
		);
	}
}
