import { THREE } from "./index.ts";
import { toVec3, vec3, type Vec3 } from "./vecUtils.ts";
import { color as col } from "./colorUtils.ts";

// TODO: This belongs to the shapeTypes.ts file?
/**
 * Helper class for working with point clouds.
 */
export class Points {
	/**
	 * The inner THREE.Points object.
	 */
	innerPoints: THREE.Points<
		THREE.BufferGeometry<
			THREE.NormalBufferAttributes,
			THREE.BufferGeometryEventMap
		>,
		THREE.PointsMaterial,
		THREE.Object3DEventMap
	>;

	constructor(points: Vec3[], size: number, color: THREE.Color) {
		const vecPoints = points.map(toVec3);

		const geometry = new THREE.BufferGeometry().setFromPoints(vecPoints);

		const colors = new Float32Array(vecPoints.length * 4);

		for (let i = 0; i < vecPoints.length; i++) {
			colors[i * 4] = color.r;
			colors[i * 4 + 1] = color.g;
			colors[i * 4 + 2] = color.b;
			colors[i * 4 + 3] = 1.0;
		}

		geometry.setAttribute(
			"color",
			new THREE.Float32BufferAttribute(colors, 4)
		);

		const material = new THREE.PointsMaterial({
			vertexColors: true,
			size,
			transparent: true,
			opacity: 1.0,
			side: THREE.DoubleSide,
			fog: false,
			depthWrite: false,
		});
		this.innerPoints = new THREE.Points(geometry, material);
	}

	/**
	 * Gets the number of points in the point cloud.
	 * @returns Number of points.
	 */
	get count() {
		return this.innerPoints.geometry.getAttribute("position").count;
	}

	/**
	 * Gets the position of a specific point.
	 * @param index Index of the point to get the position for.
	 * @returns Position of the specified point.
	 */
	getPosition(index: number) {
		const attr = this.innerPoints.geometry.getAttribute("position");
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
		const attr = this.innerPoints.geometry.getAttribute("position");
		attr.setXYZ(index, pos.x, pos.y, pos.z);
		attr.needsUpdate = true;
	}

	/**
	 * Gets the color of a specific point.
	 * @param index Index of the point to get the color for.
	 * @returns Color of the specified point.
	 */
	getColor(index: number) {
		const attr = this.innerPoints.geometry.getAttribute("color");
		const r = attr.getX(index);
		const g = attr.getY(index);
		const b = attr.getZ(index);
		return new THREE.Color(r, g, b);
	}

	/**
	 * Sets the color of a specific point.
	 * @param index Index of the point to set the color for.
	 * @param color New color for the point.
	 */
	setColor(index: number, color: THREE.ColorRepresentation, alpha?: number) {
		const c = col(color);
		const attr = this.innerPoints.geometry.getAttribute("color");
		attr.setXYZ(index, c.r, c.g, c.b);
		if (alpha !== undefined) attr.setW(index, alpha);
		attr.needsUpdate = true;
	}

	/**
	 * Gets the alpha of a specific point.
	 * @param index Index of the point to get the alpha for.
	 * @returns Alpha of the specified point.
	 */
	getAlpha(index: number) {
		const attr = this.innerPoints.geometry.getAttribute("color");
		return attr.getW(index);
	}

	/**
	 * Sets the alpha of a specific point.
	 * @param index Index of the point to set the alpha for.
	 * @param alpha New alpha for the point.
	 */
	setAlpha(index: number, alpha: number) {
		const attr = this.innerPoints.geometry.getAttribute("color");
		attr.setW(index, alpha);
		attr.needsUpdate = true;
	}
}
