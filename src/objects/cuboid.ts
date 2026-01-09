import { Ctx, THREE } from "../index.ts";
import { BasicObject } from "./index.ts";

export class Cuboid extends BasicObject<THREE.BoxGeometry> {
	constructor(ctx: Ctx, width: number, height: number, depth: number) {
		const geometry = new THREE.BoxGeometry(width, height, depth);
		super(ctx, geometry);

		ctx.spawn(this.mesh);
	}

	/**
	 * Sets the width of the cuboid.
	 * @param width The new width of the cuboid.
	 */
	width(width: number): this {
		this.mesh.geometry = this.reconstructGeometry({ width });
		return this;
	}

	/**
	 * Sets the height of the cuboid.
	 * @param height The new height of the cuboid.
	 */
	height(height: number): this {
		this.mesh.geometry = this.reconstructGeometry({ height });
		return this;
	}

	/**
	 * Sets the depth of the cuboid.
	 * @param depth The new depth of the cuboid.
	 */
	depth(depth: number): this {
		this.mesh.geometry = this.reconstructGeometry({ depth });
		return this;
	}

	private reconstructGeometry(config: {
		width?: number;
		height?: number;
		depth?: number;
	}) {
		const params = this.mesh.geometry.parameters;
		return new THREE.BoxGeometry(
			config.width ?? params.width,
			config.height ?? params.height,
			config.depth ?? params.depth
		);
	}
}
