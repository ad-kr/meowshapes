import { Ctx, THREE } from "../index.ts";
import { BasicObject } from "./index.ts";

/**
 * Class representing a 3D sphere object.
 */
export class Sphere extends BasicObject<THREE.SphereGeometry> {
	constructor(ctx: Ctx, radius: number) {
		const geometry = new THREE.SphereGeometry(radius);
		super(ctx, geometry);

		ctx.spawn(this.mesh);
	}

	/**
	 * Sets the radius of the sphere.
	 * @param radius The new radius of the sphere.
	 */
	radius(radius: number): this {
		this.mesh.geometry = this.reconstructGeometry({ radius });
		return this;
	}

	/**
	 * Sets the number of width and height segments of the sphere.
	 * @param widthSegments Width segments
	 * @param heightSegments Height segments
	 */
	segments(widthSegments: number, heightSegments: number): this {
		this.mesh.geometry = this.reconstructGeometry({
			widthSegments,
			heightSegments,
		});
		return this;
	}

	private reconstructGeometry(config: {
		radius?: number;
		widthSegments?: number;
		heightSegments?: number;
	}) {
		const params = this.mesh.geometry.parameters;
		return new THREE.SphereGeometry(
			config.radius ?? params.radius,
			config.widthSegments ?? params.widthSegments,
			config.heightSegments ?? params.heightSegments
		);
	}
}
