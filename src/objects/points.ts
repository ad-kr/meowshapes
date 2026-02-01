import { Ctx, THREE, type Vec3 } from "../index.ts";
import { toVec3, vec3 } from "../vecUtils.ts";
import { type RendererObject } from "./index.ts";

type PointsColor = THREE.ColorRepresentation | THREE.ColorRepresentation[];

export class Points implements RendererObject<PointsColor> {
	/**
	 * The underlying THREE.Points mesh representing the point cloud.
	 */
	mesh: THREE.Points;

	constructor(ctx: Ctx, points: Vec3[]) {
		const vecPoints = points.map(toVec3);
		const geometry = new THREE.BufferGeometry().setFromPoints(vecPoints);

		const material = new THREE.PointsMaterial({
			vertexColors: true,
			size: 2,
			transparent: true,
			side: THREE.DoubleSide,
			fog: false,
		});

		this.mesh = new THREE.Points(geometry, material);
		this.color(ctx.COLOR.FOREGROUND);
		ctx.spawn(this.mesh);
	}

	pos(position: Vec3): this {
		this.mesh.position.copy(toVec3(position));
		return this;
	}

	color(color: PointsColor): this {
		const pointCount = this.pointCount;
		const colorArray = new Float32Array(pointCount * 4);

		if (Array.isArray(color)) {
			if (color.length !== pointCount) {
				throw new Error(
					`Color array length mismatch. Expected ${pointCount}, got ${color.length}.`,
				);
			}

			for (let i = 0; i < pointCount; i++) {
				const c = new THREE.Color(color[i]!);
				colorArray[i * 4] = c.r;
				colorArray[i * 4 + 1] = c.g;
				colorArray[i * 4 + 2] = c.b;
				colorArray[i * 4 + 3] = 1.0;
			}
		} else {
			const c = new THREE.Color(color);
			for (let i = 0; i < pointCount; i++) {
				colorArray[i * 4] = c.r;
				colorArray[i * 4 + 1] = c.g;
				colorArray[i * 4 + 2] = c.b;
				colorArray[i * 4 + 3] = 1.0;
			}
		}

		this.mesh.geometry.setAttribute(
			"color",
			new THREE.Float32BufferAttribute(colorArray, 4),
		);

		return this;
	}

	material(material: THREE.Material): this {
		this.mesh.material = material;
		return this;
	}

	/**
	 * Sets the size of the points in the point cloud.
	 * @param size The new size for the points.
	 */
	pointSize(size: number): this {
		if (this.mesh.material instanceof THREE.PointsMaterial) {
			this.mesh.material.size = size;
		}
		return this;
	}

	/**
	 * Gets the number of points in the point cloud.
	 * @returns Number of points.
	 */
	get pointCount() {
		return this.mesh.geometry.getAttribute("position").count;
	}

	/**
	 * Gets the position of a specific point.
	 * @param index Index of the point to get the position for.
	 * @returns Position of the specified point.
	 */
	getPosition(index: number) {
		const attr = this.mesh.geometry.getAttribute("position");
		const x = attr.getX(index);
		const y = attr.getY(index);
		const z = attr.getZ(index);
		return vec3(x, y, z);
	}

	/**
	 * Sets the position of a specific point.
	 * @param index Index of the point to set the position for.
	 * @param position New position for the point.
	 */
	setPosition(index: number, position: Vec3) {
		const pos = toVec3(position);
		const attr = this.mesh.geometry.getAttribute("position");
		attr.setXYZ(index, pos.x, pos.y, pos.z);
		attr.needsUpdate = true;
	}

	/**
	 * Gets the color of a specific point.
	 * @param index Index of the point to get the color for.
	 * @returns Color of the specified point.
	 */
	getColor(index: number) {
		const attr = this.mesh.geometry.getAttribute("color");
		const r = attr.getX(index);
		const g = attr.getY(index);
		const b = attr.getZ(index);
		return new THREE.Color(r, g, b);
	}

	/**
	 * Sets the color of a specific point.
	 * @param index Index of the point to set the color for.
	 * @param alpha Optional alpha value for the point.
	 * @param color New color for the point.
	 */
	setColor(index: number, color: THREE.ColorRepresentation, alpha?: number) {
		const c = new THREE.Color(color);
		const attr = this.mesh.geometry.getAttribute("color");
		attr.setXYZ(index, c.r, c.g, c.b);
		if (alpha !== undefined) this.setAlpha(index, alpha);
		attr.needsUpdate = true;
	}

	/**
	 * Gets the alpha of a specific point.
	 * @param index Index of the point to get the alpha for.
	 * @returns Alpha of the specified point.
	 */
	getAlpha(index: number) {
		const attr = this.mesh.geometry.getAttribute("color");
		return attr.getW(index);
	}

	/**
	 * Sets the alpha of a specific point.
	 * @param index Index of the point to set the alpha for.
	 * @param alpha New alpha for the point.
	 */
	setAlpha(index: number, alpha: number) {
		const attr = this.mesh.geometry.getAttribute("color");
		attr.setW(index, alpha);
		if (alpha < 1.0 && "depthWrite" in this.mesh.material) {
			this.mesh.material.depthWrite = false;
		}
		attr.needsUpdate = true;
	}
}
