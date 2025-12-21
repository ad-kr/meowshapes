import { THREE, type Sphere } from "./index.ts";
import { color, toVec3, type Vec3 } from "./utils.ts";

export type UpdateFn = (dt: number, elapsed: number) => void;

export class Ctx {
	/** The inner THREE.js Scene instance.*/
	private readonly scene: THREE.Scene;

	/**
	 * The current rendering mode.
	 *   - `RETAINED`: Objects added to the scene will remain until removed manually.
	 *   - `IMMEDIATE`: Objects added to the scene will be removed at the beginning of the next frame unless re-added
	 *     in the next update call.
	 */
	// TODO: Is this the right terminology? What about "PERSISTENT" vs "TEMPORARY"?
	private mode: "RETAINED" | "IMMEDIATE" = "RETAINED";

	/**
	 * An array of objects to be removed at the beginning of the next frame. This is only used in IMMEDIATE mode.
	 */
	private garbage: THREE.Object3D[];

	/**
	 * An array of registered update functions that will be called on each animation frame. See the {@link update}
	 * method for more details.
	 */
	private readonly updateFns: UpdateFn[];

	/**
	 * The current theme of the context. This can be used to adjust colors and styles based on light or dark mode.
	 */
	private theme: "light" | "dark" = "light";

	constructor(scene: THREE.Scene) {
		this.scene = scene;
		this.updateFns = [];
		this.garbage = [];
	}

	/**
	 * Sets the background color of the canvas.
	 * @param color A Three.js color representation. E.g. "#ff0000", "red", 0xff0000, etc.
	 * @example
	 * ctx.background("#ff0000");
	 * ctx.background("red");
	 * ctx.background(0xff0000);
	 */
	background = (color: THREE.ColorRepresentation) => {
		this.scene.background = new THREE.Color(color);
		this.scene.add;
	};

	/**
	 * Registers an update function that will be called on animation iteration. Multiple update functions can be
	 * registered at the same time. They will be called in the order they were registered.
	 *
	 * Spawning new objects inside an update function is done in "immediate mode", meaning that the object will be
	 * removed at the beginning of the next frame, unless it is re-added in the next update call.
	 *
	 * ### Performance
	 * Prefer to use retained objects and only modify their properties inside update functions for better performance.
	 *
	 * @param fn Update function, receiving delta time `dt` and `elapsed` in seconds.
	 * @example
	 * ctx.update((dt, elapsed) => {
	 *     // Moves a sphere along the X axis over time.
	 *     const position = vec3(elapsed * 20, 0, 0);
	 *     const radius = 5;
	 *     ctx.sphere(position, radius);
	 * });
	 */
	update = (fn: UpdateFn) => this.updateFns.push(fn);

	/**
	 * A collection of commonly used colors based on the current theme.
	 */
	get COLORS() {
		// The reason why we're using getters here is to ensure that the returned colors are new instances each time
		// they are accessed. Returning a static color causes issues, for example when trying to lerp between colors 🤷
		if (this.theme === "light") {
			return {
				get FOREGROUND() {
					return color("#0a0a0a");
				},
				get BACKGROUND() {
					return color("#ffffff");
				},
			};
		}
		return {
			get FOREGROUND() {
				return color("#ffffff");
			},
			get BACKGROUND() {
				return color("#0a0a0a");
			},
		};
	}

	/**
	 * Creates and adds a sphere to the scene.
	 * @param position A vector representing the position of the sphere.
	 * @param radius The radius of the sphere.
	 * @param color (Optional) A Three.js color representation for the sphere. Defaults to the context's foreground color.
	 * @returns The created THREE.Mesh instance representing the sphere. For convenience, this is typed as {@link Sphere}.
	 * @example
	 * ctx.sphere([0, 0, 0], 3); // Uses default foreground color
	 * ctx.sphere(vec3(0, 0, 0), 5, "red");
	 */
	sphere = (
		position: Vec3,
		radius: number,
		color?: THREE.ColorRepresentation
	): Sphere => {
		const pos = toVec3(position);
		const geometry = new THREE.SphereGeometry(radius);
		const material = new THREE.MeshBasicMaterial({
			color: color ?? this.COLORS.FOREGROUND,
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.copy(pos);
		this.spawn(mesh);

		return mesh;
	};

	/**
	 * Advances the update functions by one tick. This is called internally by the Renderer on each animation frame.
	 * When a tick occurs, the context enters "immediate mode". See {@link mode} for more details.
	 * @internal Do not call this method directly. The Renderer handles this internally.
	 */
	__tick(dt: number, elapsed: number) {
		this.clearGarbage();
		this.mode = "IMMEDIATE";
		for (const fn of this.updateFns) {
			fn(dt, elapsed);
		}
	}

	/**
	 * Cleans up objects marked for removal in IMMEDIATE mode.
	 */
	private clearGarbage() {
		for (const object of this.garbage) {
			this.scene.remove(object);
		}
		this.garbage = [];
	}

	/**
	 * A simple wrapper around scene.add that makes handling immediate mode easier.
	 * @param object A Three.js object
	 */
	private spawn(object: THREE.Object3D) {
		this.scene.add(object);

		if (this.mode === "IMMEDIATE") {
			this.garbage.push(object);
		}
	}
}
