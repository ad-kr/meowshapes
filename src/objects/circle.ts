import { Ctx, THREE } from "../index.ts";
import { BasicObject } from "./index.ts";

/**
 * Class representing a 3D circle object.
 */
export class Circle extends BasicObject<THREE.CircleGeometry> {
	constructor(ctx: Ctx, radius: number) {
		const geometry = new THREE.CircleGeometry(radius);
		super(ctx, geometry);

		ctx.spawn(this.mesh);
	}

	/**
	 * Sets the radius of the circle.
	 * @param radius The new radius of the circle.
	 */
	radius(radius: number): this {
		this.mesh.geometry = this.reconstructGeometry({ radius });
		return this;
	}

	/**
	 * Sets the number of segments of the circle.
	 * @param segments The new number of segments.
	 * @returns The updated Circle object.
	 */
	segments(segments: number): this {
		this.mesh.geometry = this.reconstructGeometry({ segments });
		return this;
	}

	private reconstructGeometry(config: {
		radius?: number;
		segments?: number;
	}) {
		const params = this.mesh.geometry.parameters;
		return new THREE.CircleGeometry(
			config.radius ?? params.radius,
			config.segments ?? params.segments
		);
	}
}
