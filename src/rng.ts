import { SimplexNoise } from "three/addons/math/SimplexNoise.js";
import type { Vec2, Vec3 } from "./index.ts";
import { toVec3, vec3 } from "./vecUtils.ts";

const randomSimplex = new SimplexNoise(Math);

/**
 * Returns a simplex noise value at the given position. Position can be a number, Vec2 or Vec3.
 * ### Example
 * ```js
 * const value = noise([10, 20, 30], "my-seed");
 * ```
 * @param pos The position to sample the noise at.
 * @param seed An optional seed string to create a seeded noise pattern.
 * @returns The noise value at the given position.
 */
export const noise = (pos: number | Vec2 | Vec3, seed?: string) => {
	const posVec = typeof pos === "number" ? vec3(pos, 0, 0) : toVec3(pos);
	const simplex =
		seed === undefined
			? randomSimplex
			: // TODO: This produces really squarish patterns hmmmm: SeededRandom is not reandom enough i guess
			  new SimplexNoise(new SeededRandom(seed));
	return simplex.noise3d(posVec.x, posVec.y, posVec.z);
};

/**
 * Returns the fractal brownian motion (fbm) value at the given position. This is a "layered noise" function that iterates
 * over multiple octaves of noise to create more complex patterns.
 * ### Example
 * ```js
 * const value: number = fbm(32, {
 *     seed: "my-seed",
 *     octaves: 6, // Number of noise layers to combine
 *     lacunarity: 2.0, // Frequency multiplier between octaves
 *     gain: 0.5, // Amplitude multiplier between octaves, below 1.0 to reduce amplitude each octave
 * });
 * ```
 * @param pos The position to sample the fbm noise at. Can be a number, Vec2 or Vec3.
 * @param config Configuration options for the fbm function.
 * @returns The fbm noise value at the given position.
 */
export const fbm = (
	pos: number | Vec2 | Vec3,
	config?: {
		seed?: string;
		octaves?: number;
		lacunarity?: number;
		gain?: number;
	}
) => {
	const posVec = typeof pos === "number" ? vec3(pos, 0, 0) : toVec3(pos);
	const {
		seed = undefined,
		octaves = 4,
		lacunarity = 2,
		gain = 0.5,
	} = config ?? {};

	let amplitude = 1;
	let frequency = 1;
	let sum = 0;

	for (let i = 0; i < octaves; i++) {
		sum += noise(posVec.multiplyScalar(frequency), seed) * amplitude;
		amplitude *= gain;
		frequency *= lacunarity;
	}

	return sum;
};

/**
 * Pseudo-random number generator with a seed based on this document:
 * https://github.com/bryc/code/blob/master/jshash/PRNGs.md
 */
class SeededRandom {
	hashes: [number, number, number, number];

	constructor(seed: string) {
		this.hashes = cyrb128(seed);
	}

	random() {
		const [a, b, c, d] = this.hashes;
		return sfc32(a, b, c, d);
	}
}

function cyrb128(str: string): [number, number, number, number] {
	let h1 = 1779033703,
		h2 = 3144134277,
		h3 = 1013904242,
		h4 = 2773480762;
	for (let i = 0, k; i < str.length; i++) {
		k = str.charCodeAt(i);
		h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
		h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
		h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
		h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
	}
	h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
	h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
	h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
	h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
	(h1 ^= h2 ^ h3 ^ h4), (h2 ^= h1), (h3 ^= h1), (h4 ^= h1);
	return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

function sfc32(a: number, b: number, c: number, d: number) {
	a |= 0;
	b |= 0;
	c |= 0;
	d |= 0;
	let t = (((a + b) | 0) + d) | 0;
	d = (d + 1) | 0;
	a = b ^ (b >>> 9);
	b = (c + (c << 3)) | 0;
	c = (c << 21) | (c >>> 11);
	c = (c + t) | 0;
	return (t >>> 0) / 4294967296;
}
