import {
	darkColors,
	lightColors,
	color as toColor,
	type Theme,
} from "./colorUtils.ts";
import { THREE } from "./index.ts";
import { toVec3, vec2, vec3, type Vec2, type Vec3 } from "./vecUtils.ts";
import { Font } from "three/addons/loaders/FontLoader.js";
import { Checkbox, Slider } from "./domElements.ts";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
	Arrow,
	Circle,
	Cone,
	Cuboid,
	Cylinder,
	Graph,
	Graph3d,
	HeightField,
	LineStrip,
	Plane,
	Points,
	Sphere,
	Torus,
} from "./objects/index.ts";
import { Text } from "./objects/text.ts";

export type UpdateFn = (dt: number, elapsed: number) => void;

export class Ctx {
	/**
	 * The active camera used for rendering the scene. Modify or override it to change the view.
	 *
	 * Defaults to an orthographic camera positioned at (-1, 1, 1) looking at the origin.
	 * ### Example
	 * ```js
	 * ctx.camera.position.set(10, 10, 10);
	 * ctx.camera.lookAt(0, 0, 0);
	 *
	 * ctx.camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
	 * ```
	 */
	camera: THREE.OrthographicCamera;

	/**
	 * A reference to the THREE.js Scene instance.
	 */
	private readonly sceneRef: THREE.Scene;

	/**
	 * A reference to the wrapper div containing the renderer's DOM element.
	 */
	private readonly wrapperRef: HTMLDivElement;

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
	private theme: Theme = "light";

	/**
	 * The font used for rendering text. Loaded on demand.
	 */
	font: Font | null = null;

	/**
	 * Global hemisphere light added to the scene for basic illumination.
	 */
	private globalLight: THREE.HemisphereLight;

	/**
	 * Orbit controls for the camera. Initialized when orbit() is first called.
	 */
	private orbitControls: OrbitControls | null;

	/**
	 * Current mouse position, where the center of the canvas is (0,0) and the top-right is the half-width and
	 * half-height of the canvas.
	 */
	private mousePosition: THREE.Vector2;

	constructor(scene: THREE.Scene, wrapper: HTMLDivElement) {
		this.sceneRef = scene;
		this.wrapperRef = wrapper;
		this.updateFns = [];
		this.garbage = [];
		this.mousePosition = vec2(0, 0);

		// TODO: Test that assumption:
		// Event listener should be removed automatically when wrapperRef is garbage collected.
		document.body.addEventListener("mousemove", this.onMouseMove);

		this.globalLight = new THREE.HemisphereLight(0xffffff, 0x000000, 3);
		this.spawn(this.globalLight);

		this.background(this.COLOR.BACKGROUND);

		this.camera = new THREE.OrthographicCamera();
		this.camera.near = -1000000;
		this.camera.far = 1000000;
		this.camera.position.set(-1, 1, 1);
		this.camera.lookAt(0, 0, 0);

		this.orbitControls = null;
	}

	/**
	 * Sets the current theme of the renderer, affecting colors used in the rendering context. This also sets the
	 * background to match the theme.
	 * @param theme The theme to set.
	 */
	setTheme = (theme: Theme) => {
		this.theme = theme;
		this.background(this.COLOR.BACKGROUND);
	};

	/**
	 * Sets global light intensity
	 * @param intensity Light intensity. Default is 3.
	 * @returns The hemisphere light instance.
	 */
	light = (intensity?: number) => {
		this.globalLight.intensity = intensity ?? 3;
		return this.globalLight;
	};

	/**
	 * Sets the background color of the canvas.
	 * ### Example
	 * ```js
	 * ctx.background("#ff0000");
	 * ctx.background("red");
	 * ctx.background(0xff0000);
	 * ```
	 * @param color A Three.js color representation. E.g. "#ff0000", "red", 0xff0000, etc.
	 */
	background = (color: THREE.ColorRepresentation) => {
		this.sceneRef.background = new THREE.Color(color);
	};

	/**
	 * Gets or sets the zoom level of the camera. The zoom level is the inverse of the camera's scale.
	 * @param value (Optional) If provided, sets the zoom level to this factor.
	 * @returns The current zoom level of the camera.
	 */
	zoom = (value?: number) => {
		if (value !== undefined) {
			this.camera.scale.setScalar(1 / value);
		}
		const { x: scaleX, y: scaleY, z: scaleZ } = this.camera.scale;
		return 1 / Math.min(scaleX, scaleY, scaleZ);
	};

	/**
	 * Configures orbit controls for the camera.
	 * ### Example
	 * ```js
	 * ctx.orbit(); // Default orbit controls
	 * ctx.orbit({ target: [0, 0, 0], autoRotate: 1.0 }); // Orbit around the origin with auto-rotation speed of 1.0
	 * ```
	 * @param config (Optional) Configuration options for the orbit controls.
	 */
	orbit = (config?: {
		/** The target position for the orbit controls to look at */
		target?: Vec3;
		/** The auto-rotate speed. If defined, enables auto-rotation */
		autoRotate?: number;
		/** Whether to enable rotation. Default is true. */
		enabledRotate?: boolean;
		/** Whether to enable panning. Default is true. */
		enablePan?: boolean;
		/** Whether to enable zooming. Default is true. */
		enableZoom?: boolean;
	}) => {
		if (this.orbitControls === null) {
			this.orbitControls = new OrbitControls(
				this.camera,
				this.wrapperRef,
			);

			if (this.mode !== "IMMEDIATE") {
				this.update(() => {
					this.orbitControls!.update();
				});
			}
		}

		if (config !== undefined) {
			if (config.target !== undefined) {
				this.orbitControls.target.copy(toVec3(config.target));
			}

			this.orbitControls.autoRotate = true;
			this.orbitControls.autoRotateSpeed = config.autoRotate ?? 0;
			this.orbitControls.enableRotate = config.enabledRotate ?? true;
			this.orbitControls.enablePan = config.enablePan ?? true;
			this.orbitControls.enableZoom = config.enableZoom ?? true;
		}

		this.orbitControls.update();
	};

	/**
	 * Gets the current mouse position where the center of the canvas is (0,0) and the top-right is the half-width and
	 * half-height of the canvas.
	 * @returns A Vector2 representing the mouse position.
	 */
	mouse = () => {
		return this.mousePosition.clone();
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
	 * ### Example
	 * ```js
	 * ctx.update((dt, elapsed) => {
	 *     // Moves a sphere along the X axis over time.
	 *     const position = vec3(elapsed * 20, 0, 0);
	 *     const radius = 5;
	 *     ctx.sphere(position, radius);
	 * });
	 * ```
	 * @param fn Update function, receiving delta time `dt` and `elapsed` in seconds.
	 */
	update = (fn: UpdateFn) => this.updateFns.push(fn);

	/**
	 * A collection of commonly used colors based on the current theme.
	 */
	get COLOR() {
		return this.theme === "light" ? lightColors : darkColors;
	}

	/**
	 * Creates and adds a 3D text to the scene.
	 * ### Example
	 * ```js
	 * ctx.text("Hello, World!").size(12).dir("rtl");
	 *
	 * ctx.text("Always facing the camera").billboard();
	 * ```
	 * @param value The text string to be rendered.
	 * @returns The created {@link Text} instance.
	 */
	text = (value: string) => new Text(this, value);

	/**
	 * Creates a button element and adds it to the renderer's DOM wrapper.
	 * ### Example
	 * ```js
	 * let count = 0;
	 * const button = ctx.button("Increase", () => {
	 *     count++;
	 * });
	 *
	 * ctx.update(() => {
	 *     ctx.text(`Count: ${count}`);
	 * });
	 * ```
	 * @param label The text label of the button.
	 * @param onClick The callback function to be executed when the button is clicked.
	 * @returns The created HTMLButtonElement.
	 */
	button = (label: string, onClick: () => void) => {
		const button = document.createElement("button");
		button.textContent = label;
		button.onclick = onClick;

		button.classList.add("renderer-button");
		if (this.theme === "dark") {
			button.classList.add("dark");
		}

		this.wrapperRef.appendChild(button);
		return button;
	};

	/**
	 * Creates a slider element and adds it to the renderer's DOM wrapper.
	 * ### Example
	 * ```js
	 * const radiusSlider = ctx.slider("Radius", 1, 100);
	 *
	 * ctx.update(() => {
	 *    const radius = radiusSlider.value();
	 *    ctx.sphere([0, 0, 0], radius);
	 * });
	 *
	 * // Slider with custom step size and initial value
	 * ctx.slider("Opacity", 0, 1, 0.25, { step: 0.01 });
	 * ```
	 * @param label The text label of the slider. If null or empty, no label is created.
	 * @param min The minimum value of the slider.
	 * @param max The maximum value of the slider.
	 * @param initial The initial value of the slider. If null, defaults to the midpoint between min and max.
	 * @param config Configuration options for the slider, such as step size and whether to show the current value.
	 * @returns A Slider object containing references to the created DOM elements and methods to get/set the slider value.
	 */
	slider = (
		label: string | null,
		min: number,
		max: number,
		initial?: number | null,
		config?: { step?: number; showValue?: boolean },
	) => {
		const container = document.createElement("div");
		container.classList.add("renderer-slider-container");

		if (this.theme === "dark") {
			container.classList.add("dark");
		}

		const input = document.createElement("input");
		input.type = "range";
		input.min = min.toString();
		input.max = max.toString();

		const labelContainer = document.createElement("div");

		let labelElement: HTMLLabelElement | null = null;
		if (label !== null && label !== "") {
			labelElement = document.createElement("label");
			labelElement.textContent = label;

			const inputId = `slider-${Math.random().toString(36).substring(2)}`;
			labelElement.htmlFor = inputId;
			input.id = inputId;

			labelContainer.appendChild(labelElement);
		}

		let valueLabel = null;
		if (config?.showValue ?? false == false) {
			valueLabel = document.createElement("span");
			valueLabel.textContent =
				initial?.toString() ?? ((min + max) / 2).toString();
			labelContainer.appendChild(valueLabel);

			input.addEventListener("input", () => {
				valueLabel!.textContent = input.value;
			});
		}

		const range = max - min;
		const step = config?.step ?? range / 10;
		const value = initial ?? min + range / 2;

		input.step = step.toString();
		input.value = value.toString();

		container.appendChild(labelContainer);
		container.appendChild(input);
		this.wrapperRef.appendChild(container);

		return new Slider(
			container,
			input,
			labelContainer,
			labelElement,
			valueLabel,
		);
	};

	/**
	 * Creates a text element (span) and adds it to the renderer's DOM wrapper.
	 * ### Example
	 * ```js
	 * ctx.textElement("Hello, World!", 24, "red");
	 * ```
	 * @param value The text content of the element.
	 * @param size The font size of the text element in pixels. Defaults to 16 if not provided.
	 * @param color The color of the text. Defaults to the context's foreground color if not provided.
	 * @returns The created HTMLSpanElement.
	 */
	textElement = (
		value: string,
		size?: number | null,
		color?: THREE.ColorRepresentation,
	) => {
		const span = document.createElement("span");
		span.classList.add("renderer-text-element");
		span.style.fontSize = `${size ?? 16}px`;
		span.style.color = toColor(color ?? this.COLOR.FOREGROUND).getStyle();
		span.textContent = value;
		this.wrapperRef.appendChild(span);

		return span;
	};

	/**
	 * Creates a checkbox element and adds it to the renderer's DOM wrapper.
	 * ### Example
	 * ```js
	 * const checkbox = ctx.checkbox("Enable Feature");
	 *
	 * ctx.update(() => {
	 *    if (checkbox.value()) {
	 *       // Feature is enabled
	 *    }
	 * });
	 *
	 * // Usage with callback:
	 * ctx.checkbox("Show Grid", true, (isChecked) => {
	 *    console.log("Checkbox is now:", isChecked);
	 * });
	 * ```
	 * @param label The text label of the checkbox.
	 * @param initial The initial checked state of the checkbox. Defaults to false.
	 * @param onToggle The callback function to be executed when the checkbox state changes.
	 * @returns A Checkbox object containing references to the created DOM elements and methods to get/set the checkbox state.
	 */
	checkbox = (
		label: string | null,
		initial?: boolean,
		onToggle?: (isChecked: boolean) => void,
	) => {
		const container = document.createElement("div");
		container.classList.add("renderer-checkbox-container");
		if (this.theme === "dark") {
			container.classList.add("dark");
		}

		const input = document.createElement("input");
		input.type = "checkbox";
		input.checked = initial ?? false;

		if (onToggle !== undefined) {
			input.addEventListener("change", () => onToggle(input.checked));
		}

		container.appendChild(input);

		let labelElement: HTMLLabelElement | null = null;
		if (label !== null && label !== "") {
			labelElement = document.createElement("label");
			labelElement.textContent = label;
			const inputId = `checkbox-${Math.random()
				.toString(36)
				.substring(2)}`;
			labelElement.htmlFor = inputId;
			input.id = inputId;
			container.appendChild(labelElement);
		}

		this.wrapperRef.appendChild(container);

		return new Checkbox(container, input, labelElement);
	};

	/**
	 * Creates and adds a line between two points to the scene.
	 * ### Example
	 * ```js
	 * const line = ctx.line([0, 0, 0], [10, 10, 10]);
	 *
	 * line
	 *     .color("blue")
	 *     .linewidth(5)
	 *     .dashed(2, 1);
	 * ```
	 * @param start Starting position of the line.
	 * @param end Ending position of the line.
	 * @returns The created {@link LineStrip} instance.
	 */
	line = (start: Vec3, end: Vec3) => this.lineStrip([start, end]);

	/**
	 * Creates and adds a line strip to the scene.
	 * ### Example
	 * ```js
	 * const strip = ctx.lineStrip([[0, 0, 0], [10, 0, 0], [10, 10, 0]]);
	 *
	 * strip
	 *    .color(["green", "yellow", "red"])
	 *    .linewidth(10)
	 *    .dashed(4, 2);
	 * ```
	 * @param points An array of vectors representing the points of the line strip.
	 * @returns The created {@link LineStrip} object.
	 */
	lineStrip = (points: Vec3[]) => new LineStrip(this, points);

	/**
	 * Creates an arrow from a start point to an end point.
	 * ### Example
	 * ```js
	 * const arrow = ctx.arrow([0, 0, 0], [10, 10, 10]);
	 *
	 * arrow
	 *     .color("red")
	 *     .linewidth(3).dashed(1, 1);
	 *
	 * ctx.arrow([0, 0, 0], [10, 0, 0], 5); // Arrow with custom head length
	 * ```
	 * @param start Starting position of the arrow.
	 * @param end Ending position of the arrow.
	 * @param headLength (Optional) Length of the arrowhead.
	 * @returns The created {@link Arrow} instance.
	 */
	arrow = (start: Vec3, end: Vec3, headLength?: number) =>
		new Arrow(this, start, end, headLength);

	/**
	 * Creates an arrow starting from the origin (0, 0, 0) up to the given vector.
	 * ### Example
	 * ```js
	 * ctx.vector([10, 10, 10]);
	 * ```
	 * @param vec The vector to be drawn.
	 * @param headLength (Optional) Length of the arrowhead.
	 * @returns The created {@link Arrow} instance.
	 */
	vector = (vec: Vec3, headLength?: number) =>
		this.arrow(vec3(0, 0, 0), vec, headLength);

	/**
	 * Creates a cuboid (rectangular box) object.
	 * ### Example
	 * ```js
	 * const box = ctx.cuboid(10, 5, 3);
	 *
	 * box.width(15).height(7).depth(4);
	 * ```
	 * @param width Width of the cuboid on the x-axis
	 * @param height Height of the cuboid on the y-axis
	 * @param depth Depth of the cuboid on the z-axis
	 * @returns The created {@link Cuboid} object.
	 */
	cuboid = (width: number, height: number, depth: number) =>
		new Cuboid(this, width, height, depth);

	/**
	 * Creates and adds a circle to the scene.
	 * ### Example
	 * ```js
	 * const circle = ctx.circle(5);
	 * circle.radius(10).segments(64).pos([0, 0, 0]).color("blue");
	 * ```
	 * @param radius The radius of the circle.
	 * @returns The created {@link Circle} object.
	 */
	circle = (radius: number) => new Circle(this, radius);

	/**
	 * Creates and adds a cylinder to the scene.
	 * ### Example
	 * ```js
	 * const cylinder = ctx.cylinder(5, 5, 10);
	 *
	 * cylinder
	 *     .radiusTop(7)
	 *     .radiusBottom(3)
	 *     .height(15)
	 *     .segments(32)
	 *     .pos([0, 0, 0])
	 *     .color("green");
	 * ```
	 * @param radiusTop The radius of the cylinder at the top.
	 * @param radiusBottom The radius of the cylinder at the bottom.
	 * @param height The height of the cylinder.
	 * @returns The created {@link Cylinder} object.
	 */
	cylinder = (radiusTop: number, radiusBottom: number, height: number) =>
		new Cylinder(this, radiusTop, radiusBottom, height);

	/**
	 * Creates and adds a plane to the scene.
	 * ### Example
	 * ```js
	 * const plane = ctx.plane(10, 10);
	 *
	 * plane
	 *     .width(20)
	 *     .height(15)
	 *     .pos([0, 0, 0])
	 *     .color("gray");
	 * ```
	 * @param width The width of the plane.
	 * @param height The height of the plane.
	 * @returns The created {@link Plane} object.
	 */
	plane = (width: number, height: number) => new Plane(this, width, height);

	/**
	 * Creates and adds a torus to the scene.
	 * ### Example
	 * ```js
	 * const torus = ctx.torus(10, 3);
	 *
	 * torus
	 *    .radius(15)
	 *    .tubeRadius(5)
	 *    .radialSegments(64)
	 *    .tubularSegments(32)
	 *    .pos([0, 0, 0])
	 *    .color("purple");
	 * ```
	 * @param radius
	 * @param tubeRadius
	 * @returns
	 */
	torus = (radius: number, tubeRadius: number) =>
		new Torus(this, radius, tubeRadius);

	/**
	 * Creates and adds a sphere to the scene.
	 * ### Example
	 * ```js
	 * const sphere = ctx.sphere(3);
	 *
	 * sphere.radius(42);
	 *
	 * ctx.sphere(10)
	 *     .pos([10, 10, 10])
	 *     .color("red")
	 *     .segments(32, 12);
	 * ```
	 * @param radius The radius of the sphere.
	 * @returns The created {@link Sphere} object.
	 */
	sphere = (radius: number) => new Sphere(this, radius);

	/**
	 * Creates and adds a cone to the scene.
	 * ### Example
	 * ```js
	 * const cone = ctx.cone(5, 10)
	 *     .pos([0, 10, 0])
	 *     .color("blue");
	 *
	 * cone.radius(7).height(15).segments(32);
	 * ```
	 * @param radius Radius of the cone base
	 * @param height Height of the cone from base to tip
	 * @returns The created {@link Cone} object.
	 */
	cone = (radius: number, height: number) => new Cone(this, radius, height);

	/**
	 * Creates and adds a graph of a mathematical function to the scene.
	 * ### Example
	 * ```js
	 * // Graph a sine wave from -10 to 10
	 * ctx.graph(x => Math.sin(x));
	 *
	 * // Graph a quadratic function over the range -5 to 5
	 * ctx.graph(x => x * x, [-5, 5])
	 *     .dashed()
	 *     .linewidth(5)
	 *     .color("blue");
	 * ```
	 * @param func The mathematical function to graph. A function of x returning y.
	 * @param range (Optional) The range [from, to] over which to graph the function.
	 * @returns The created {@link Graph} instance.
	 */
	graph = (func: (x: number) => number, range?: [number, number]) =>
		new Graph(this, func, range);

	/**
	 * Creates and adds a 3D graph of a mathematical function to the scene.
	 * ### Example
	 * ```js
	 * // Graph a 3D cosine-sine surface over a PI * PI area
	 * ctx.graph3d((x, z) => Math.sin(x) * Math.cos(z), [Math.PI, Math.PI]);
	 *
	 * // Graph a function with a grid overlay and variable color
	 * ctx.graph3d((x, z) => x * z * 5)
	 *    .grid(16, 32)
	 *    .color((x, y, z) => ctx.COLOR.heatmap((y + 1) / 2));
	 * ```
	 * @param func The mathematical function to graph. A function of (x, z) returning y.
	 * @param size (Optional) The size [width, depth] of the area to graph the function over.
	 * @returns The created {@link Graph3d} instance.
	 */
	graph3d = (func: (x: number, z: number) => number, size?: Vec2) =>
		new Graph3d(this, func, size);

	/**
	 * Creates and adds a grid helper to the scene.
	 * ### Example
	 * ```js
	 * ctx.grid(); // Default grid
	 * ctx.grid(500, 25); // Grid of size 500 with 25 unit spacing
	 * ctx.grid(400, 20, "gray", [0, 0, 1]); // Grid with normal along Z axis
	 * ```
	 * @param size The size of the grid.
	 * @param spacing The spacing between grid lines. Defaults to 50 units.
	 * @param color The color of the grid lines. Defaults to the context's secondary color.
	 * @param normal The normal vector defining the orientation of the grid. Defaults to (0, 1, 0).
	 * @returns The created THREE.GridHelper instance.
	 */
	grid = (
		size?: number | null,
		spacing?: number | null,
		color?: THREE.ColorRepresentation | null,
		normal?: Vec3,
	) => {
		const gridSize = size ?? this.getCameraExtent();
		const divisions = gridSize / (spacing ?? 50);

		const gridHelper = new THREE.GridHelper(
			gridSize,
			divisions,
			color ?? this.COLOR.SECONDARY,
			color ?? this.COLOR.SECONDARY,
		);

		const rotation = new THREE.Quaternion();
		rotation.setFromUnitVectors(vec3(0, 1, 0), toVec3(normal ?? [0, 1, 0]));
		gridHelper.quaternion.copy(rotation);

		this.spawn(gridHelper);
		return gridHelper;
	};

	/**
	 * Creates and adds a point cloud to the scene.
	 * ### Example
	 * ```js
	 * // Create a point cloud with random points
	 * const pts = new Array(1000).fill(0).map(() => [
	 *     Math.random() * 100 - 50,
	 *     Math.random() * 100 - 50,
	 *     Math.random() * 100 - 50
	 * ]);
	 * ctx.points(pts)
	 *     .size(3)
	 *     .color("red");
	 * ```
	 * @param points Array of point positions.
	 * @returns The created {@link Points} instance.
	 */
	points = (points: Vec3[]) => new Points(this, points);

	/**
	 * Creates and adds a height field to the scene.
	 * ### Example
	 * ```js
	 * // Height field with random heights
	 * const heights = new Array(100).fill(0).map(() => Math.random() * 10);
	 * ctx.heightField([100, 100], [9, 9], heights);
	 *
	 * // Height field with per-vertex colors
	 * ctx.heightField([100, 100], [1, 1], [0, 0, 0, 0])
	 *     .color(["blue", "red", "green", "yellow"]);
	 * ```
	 * @param size A 2D vector representing the size of the height field in the X and Z dimensions.
	 * @param segments A 2D vector representing the number of segments in the X and Z dimensions.
	 * @param heights An array of heights for each vertex in the height field.
	 * @returns The create {@link HeightField} instance.
	 */
	heightField = (
		size: Vec2,
		segments: Vec2,
		heights: Float64Array | number[],
	) => new HeightField(this, size, segments, heights);

	/**
	 * Spawns a Three.js object into the scene. In IMMEDIATE mode, the object will be removed at the beginning of the
	 * next frame unless re-added in the next update call. See {@link mode} for more details.
	 * @param object A Three.js object
	 */
	spawn = (object: THREE.Object3D) => {
		this.sceneRef.add(object);

		if (this.mode === "IMMEDIATE") {
			this.garbage.push(object);
		}
	};

	/**
	 * Removes a Three.js object from the scene.
	 * @param object A Three.js object
	 */
	remove = (object: THREE.Object3D) => {
		this.sceneRef.remove(object);
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
	 * @internal Checks if there are any registered update functions.
	 */
	__hasUpdateFns = () => this.updateFns.length > 0;

	/**
	 * @internal Updates camera bounds given width and height of the renderer.
	 */
	__setCameraBounds = (width: number, height: number) => {
		this.camera.left = -width * 0.5;
		this.camera.right = width * 0.5;
		this.camera.top = height * 0.5;
		this.camera.bottom = -height * 0.5;
		this.camera.updateProjectionMatrix();
	};

	/**
	 * @internal Returns the current rendering mode.
	 */
	__getMode = () => this.mode;

	/**
	 * Returns the absolute value of the near or far plane, whichever is larger. Used for setting range limits for
	 * graphs and similar objects. (Not and ideal solution, but works for now.)
	 */
	private getCameraExtent() {
		if (
			this.camera instanceof THREE.PerspectiveCamera ||
			this.camera instanceof THREE.OrthographicCamera
		) {
			const near = Math.abs(this.camera.near);
			const far = Math.abs(this.camera.far);
			return Math.max(near, far);
		}
		return 10000;
	}

	/**
	 * Cleans up objects marked for removal in IMMEDIATE mode.
	 */
	private clearGarbage() {
		for (const object of this.garbage) {
			this.sceneRef.remove(object);
		}
		this.garbage = [];
	}

	/**
	 * Handles mouse move events to update the current mouse position.
	 */
	private onMouseMove = (event: MouseEvent) => {
		const bounds = this.wrapperRef.getBoundingClientRect();
		this.mousePosition.x =
			event.clientX - this.wrapperRef.clientWidth * 0.5 - bounds.left;
		this.mousePosition.y =
			-event.clientY + this.wrapperRef.clientHeight * 0.5 + bounds.top;
	};
}
