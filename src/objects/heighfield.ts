import { Ctx, THREE, type Vec2 } from "../index.ts";
import { toVec2 } from "../vecUtils.ts";
import { BasicObject } from "./index.ts";

type HeightFieldColor = THREE.ColorRepresentation | THREE.ColorRepresentation[];

export class HeightField extends BasicObject<THREE.PlaneGeometry> {
	constructor(
		ctx: Ctx,
		size: Vec2,
		segments: Vec2,
		heights: Float64Array | number[]
	) {
		const { x: width, y: depth } = toVec2(size);
		const { x: widthSegments, y: depthSegments } = toVec2(segments);

		const heightCount = heights.length;
		const expectedCount = (widthSegments + 1) * (depthSegments + 1);
		if (heightCount !== expectedCount) {
			throw new Error(
				`Heights array length mismatch. Expected ${expectedCount}, got ${heightCount}.`
			);
		}

		const geometry = new THREE.PlaneGeometry(
			width,
			depth,
			widthSegments,
			depthSegments
		);

		geometry.rotateX(-Math.PI / 2);

		const posAttr = geometry.getAttribute("position");

		for (let i = 0; i < posAttr.count; i++) {
			const height = heights[i]!;
			posAttr.setY(i, height);
		}

		super(ctx, geometry);

		this.material(
			new THREE.MeshBasicMaterial({
				vertexColors: true,
				side: THREE.DoubleSide,
				color: new THREE.Color(0xffffff),
			})
		);

		this.color(ctx.COLOR.FOREGROUND);

		ctx.spawn(this.mesh);
	}

	/**
	 * Sets the color of the height field.
	 * @param color A single color or an array of colors for each vertex.
	 */
	color(color: HeightFieldColor): this {
		const pointCount = this.pointCount;

		const colorArray = new Float32Array(pointCount * 3);
		if (Array.isArray(color)) {
			if (color.length !== pointCount) {
				throw new Error(
					`Color array length must match vertex count. Expected ${pointCount}, got ${color.length}.`
				);
			}
			for (let i = 0; i < pointCount; i++) {
				const c = new THREE.Color(color[i]);
				colorArray[i * 3] = c.r;
				colorArray[i * 3 + 1] = c.g;
				colorArray[i * 3 + 2] = c.b;
			}
		} else {
			const c = new THREE.Color(color);
			for (let i = 0; i < pointCount; i++) {
				colorArray[i * 3] = c.r;
				colorArray[i * 3 + 1] = c.g;
				colorArray[i * 3 + 2] = c.b;
			}
		}
		this.mesh.geometry.setAttribute(
			"color",
			new THREE.Float32BufferAttribute(colorArray, 3)
		);

		return this;
	}

	/**
	 * Gets the number of vertices in the height field.
	 * @returns Number of vertices.
	 */
	get pointCount(): number {
		return this.mesh.geometry.getAttribute("position").count;
	}

	/**
	 * Gets the height of a specific vertex.
	 * @param index Index of the vertex to get the height for.
	 * @returns Height of the specified vertex.
	 */
	getHeight(index: number) {
		const attr = this.mesh.geometry.getAttribute("position");
		return attr.getY(index);
	}

	/**
	 * Sets the height of a specific vertex.
	 * @param index Index of the vertex to set the height for.
	 * @param height New height for the vertex.
	 */
	setHeight(index: number, height: number) {
		const attr = this.mesh.geometry.getAttribute("position");
		attr.setY(index, height);
		attr.needsUpdate = true;
	}

	/**
	 * Gets the color of a specific vertex.
	 * @param index Index of the vertex to get the color for.
	 * @returns Color of the specified vertex.
	 */
	getColor(index: number) {
		const attr = this.mesh.geometry.getAttribute("color");
		const r = attr.getX(index);
		const g = attr.getY(index);
		const b = attr.getZ(index);
		return new THREE.Color(r, g, b);
	}

	/**
	 * Sets the color of a specific vertex.
	 * @param index Index of the vertex to set the color for.
	 * @param color New color for the vertex.
	 */
	setColor(index: number, color: THREE.ColorRepresentation) {
		const c = new THREE.Color(color);
		const attr = this.mesh.geometry.getAttribute("color");
		attr.setXYZ(index, c.r, c.g, c.b);
		attr.needsUpdate = true;
	}
}
