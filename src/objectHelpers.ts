import { Object3D } from "three";
import { THREE, type Vec3 } from "./index.ts";
import { Line2 } from "three/addons/lines/Line2.js";
import { color as col } from "./colorUtils.ts";
import { toVec3, vec3 } from "./vecUtils.ts";

export type Text = THREE.Mesh<
	THREE.ShapeGeometry,
	THREE.MeshBasicMaterial | THREE.MeshStandardMaterial
>;
export type Sphere = THREE.Mesh<
	THREE.SphereGeometry,
	THREE.MeshBasicMaterial | THREE.MeshStandardMaterial
>;
export type Cone = THREE.Mesh<
	THREE.ConeGeometry,
	THREE.MeshBasicMaterial | THREE.MeshStandardMaterial
>;

/**
 *  A container for arrow components, line and cone. Line and cone are supplied in their correct positions, pointing
 *  upwards.
 */
export class Arrow extends Object3D {
	/**
	 * The line part of the arrow.
	 */
	line: Line2;

	/**
	 * The cone part of the arrow.
	 */
	cone: Cone;

	constructor(pos: Vec3, dir: Vec3, line: Line2, cone: Cone) {
		super();

		this.line = line;
		this.cone = cone;

		this.line.matrixAutoUpdate = false;
		this.cone.matrixAutoUpdate = false;

		this.add(this.line);
		this.add(this.cone);

		const posVector = toVec3(pos);
		const dirVector = toVec3(dir);

		this.position.copy(posVector);

		if (dirVector.y > 0.9999) {
			this.quaternion.set(0, 0, 0, 1);
		} else if (dirVector.y < -0.9999) {
			this.quaternion.set(1, 0, 0, 0);
		} else {
			const axis = vec3(dirVector.z, 0, -dirVector.x).normalize();
			const angle = Math.acos(dirVector.y);
			this.quaternion.setFromAxisAngle(axis, angle);
		}
	}
}

/**
 * Helper class for working with point clouds.
 */
export class Points {
	/**
	 * The inner THREE.Points mesh object.
	 */
	mesh: THREE.Points<
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
		});
		this.mesh = new THREE.Points(geometry, material);
	}

	/**
	 * Gets the number of points in the point cloud.
	 * @returns Number of points.
	 */
	get count() {
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
	 * @param color New color for the point.
	 */
	setColor(index: number, color: THREE.ColorRepresentation, alpha?: number) {
		const c = col(color);
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
		if (alpha < 1.0) this.mesh.material.depthWrite = false;
		attr.needsUpdate = true;
	}
}
