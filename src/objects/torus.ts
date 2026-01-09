import { THREE, type Ctx } from "../index.ts";
import { BasicObject } from "./index.ts";

export class Torus extends BasicObject<THREE.TorusGeometry> {
	constructor(ctx: Ctx, radius: number, tubeRadius: number) {
		const geometry = new THREE.TorusGeometry(radius, tubeRadius);
		super(ctx, geometry);

		ctx.spawn(this.mesh);
	}

	/**
	 * Sets the radius of the torus.
	 * @param radius The new radius of the torus.
	 */
	radius(radius: number): this {
		this.mesh.geometry = this.reconstructGeometry({ radius });
		return this;
	}

	/**
	 * Sets the tube radius of the torus.
	 * @param tubeRadius The new tube radius of the torus.
	 */
	tubeRadius(tubeRadius: number): this {
		this.mesh.geometry = this.reconstructGeometry({ tubeRadius });
		return this;
	}

	/**
	 * Sets the number of radial segments of the torus.
	 * @param radialSegments The new number of radial segments.
	 */
	radialSegments(radialSegments: number): this {
		this.mesh.geometry = this.reconstructGeometry({ radialSegments });
		return this;
	}

	/**
	 * Sets the number of tubular segments of the torus.
	 * @param tubularSegments The new number of tubular segments.
	 */
	tubularSegments(tubularSegments: number): this {
		this.mesh.geometry = this.reconstructGeometry({ tubularSegments });
		return this;
	}

	private reconstructGeometry(config: {
		radius?: number;
		tubeRadius?: number;
		radialSegments?: number;
		tubularSegments?: number;
	}) {
		const params = this.mesh.geometry.parameters;
		return new THREE.TorusGeometry(
			config.radius ?? params.radius,
			config.tubeRadius ?? params.tube,
			config.radialSegments ?? params.radialSegments,
			config.tubularSegments ?? params.tubularSegments
		);
	}
}
