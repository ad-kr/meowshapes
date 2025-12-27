import { Object3D } from "three";
import type { THREE, Vec3 } from "./index.ts";
import { Line2 } from "three/addons/lines/Line2.js";
import { toVec3, vec3 } from "./utils.ts";

export type Text = THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>;
export type Sphere = THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
export type Cone = THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial>;

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
