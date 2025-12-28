import * as THREE from "three";

/** Returns a new THREE.Vector2 instance. */
export const vec2 = (x: number, y: number) => {
	return new THREE.Vector2(x, y);
};
/** Returns a new THREE.Vector3 instance. */
export const vec3 = (x: number, y: number, z: number) => {
	return new THREE.Vector3(x, y, z);
};
/** Returns a new THREE.Vector4 instance. */
export const vec4 = (x: number, y: number, z: number, w: number) => {
	return new THREE.Vector4(x, y, z, w);
};

// Type definitions for flexible vector inputs
export type Vec2 = [number, number] | THREE.Vector2;
export type Vec3 = [number, number, number] | THREE.Vector3 | Vec2;
export type Vec4 = [number, number, number, number] | THREE.Vector4 | Vec3;

/** Converts various vector representations to THREE.Vector2. */
export const toVec2 = (v: Vec2) => {
	if (v instanceof THREE.Vector2) return v;
	return new THREE.Vector2(v[0], v[1]);
};

/** Converts various vector representations to THREE.Vector3. */
export const toVec3 = (v: Vec3) => {
	if (v instanceof THREE.Vector3) {
		return v;
	} else if ((v as any)[2] !== undefined) {
		const va = v as [number, number, number];
		return new THREE.Vector3(va[0], va[1], va[2]);
	}
	const v2 = toVec2(v as Vec2);
	return new THREE.Vector3(v2.x, v2.y, 0);
};

/** Converts various vector representations to THREE.Vector4. */
export const toVec4 = (v: Vec4) => {
	if (v instanceof THREE.Vector4) {
		return v;
	} else if ((v as any)[3] !== undefined) {
		const va = v as [number, number, number, number];
		return new THREE.Vector4(va[0], va[1], va[2], va[3]);
	}
	const v3 = toVec3(v as Vec3);
	return new THREE.Vector4(v3.x, v3.y, v3.z, 0);
};

/** Common direction vectors. */
export const DIR = {
	get Y() {
		return vec3(0, 1, 0);
	},
	get NEG_Y() {
		return vec3(0, -1, 0);
	},
	get X() {
		return vec3(1, 0, 0);
	},
	get NEG_X() {
		return vec3(-1, 0, 0);
	},
	get Z() {
		return vec3(0, 0, 1);
	},
	get NEG_Z() {
		return vec3(0, 0, -1);
	},
};
