import {
	darkColors,
	lightColors,
	toMaterial,
	type ObjectColor,
	type Theme,
} from "./colorUtils.ts";
import { THREE, type Sphere } from "./index.ts";
import { Arrow, type Cone, type Text } from "./shapeTypes.ts";
import { DIR, toVec2, toVec3, vec3, type Vec2, type Vec3 } from "./vecUtils.ts";
import { Font, FontLoader } from "three/addons/loaders/FontLoader.js";
import { Points } from "./points.ts";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { defaultFont } from "./defaultFont.ts";
import { Slider } from "./domElements.ts";

export type UpdateFn = (dt: number, elapsed: number) => void;

type LineStyle =
	| null
	| undefined
	| "dashed"
	| THREE.ColorRepresentation
	| {
			color?: THREE.ColorRepresentation;
			dashSize?: number;
			gapSize?: number;
			lineWidth?: number;
	  };

const toLineStyle = (style: LineStyle) => {
	if (style === null || style === undefined) return {};
	if (style === "dashed") return { dashSize: 20, gapSize: 10 };
	if (typeof style === "object" && !(style instanceof THREE.Color)) {
		return style;
	}
	return { color: style };
};

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
	private font: Font | null = null;

	/**
	 * Global hemisphere light added to the scene for basic illumination.
	 */
	private globalLight: THREE.HemisphereLight;

	constructor(scene: THREE.Scene, wrapper: HTMLDivElement) {
		this.sceneRef = scene;
		this.wrapperRef = wrapper;
		this.updateFns = [];
		this.garbage = [];

		this.globalLight = new THREE.HemisphereLight(0xffffff, 0x000000, 3);
		this.spawn(this.globalLight);

		this.background(this.COLOR.BACKGROUND);

		this.camera = new THREE.OrthographicCamera();
		this.camera.near = -1000000;
		this.camera.far = 1000000;
		this.camera.position.set(-1, 1, 1);
		this.camera.lookAt(0, 0, 0);
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
	 * Creates and adds 3D text to the scene.
	 * ### Example
	 * ```js
	 * ctx.text("Hello, World!", 24);
	 * ```
	 * @param value The text string to be rendered.
	 * @param size The size of the text. If null, defaults to 16.
	 * @param color (Optional) Object color. See {@link ObjectColor} for details.
	 * @param direction (Optional) The direction of the text. Can be "ltr" (left-to-right), "rtl" (right-to-left), or "tb" (top-to-bottom).
	 * @returns The created THREE.Mesh instance representing the text. For convenience, this is typed as {@link Text}.
	 */
	text = (
		value: string,
		size?: number | null,
		color?: ObjectColor,
		direction?: "ltr" | "rtl" | "tb"
	): Text => {
		if (this.font === null) {
			const loader = new FontLoader();
			this.font = loader.parse(defaultFont);
			return this.text(value, size, color, direction);
		}

		const shapes = this.font.generateShapes(value, size ?? 16, direction);
		const geometry = new THREE.ShapeGeometry(shapes);
		geometry.computeBoundingBox();
		geometry.translate(
			-(geometry.boundingBox!.max.x - geometry.boundingBox!.min.x) * 0.5,
			-(geometry.boundingBox!.max.y - geometry.boundingBox!.min.y) * 0.5,
			0
		);
		const material = toMaterial(color, this.COLOR.FOREGROUND);
		material.side = THREE.DoubleSide;
		const text = new THREE.Mesh(geometry, material);
		this.spawn(text);
		return text;
	};

	/**
	 * A billboarding version of {@link text}, which always faces the camera.
	 * ### Example
	 * ```js
	 * ctx.textBillboard("Hello, World!", 24);
	 * ```
	 * @param value The text string to be rendered.
	 * @param size The size of the text. If null, defaults to 16.
	 * @param color (Optional) Object color. See {@link ObjectColor} for details.
	 * @param direction (Optional) The direction of the text. Can be "ltr" (left-to-right), "rtl" (right-to-left), or "tb" (top-to-bottom).
	 * @returns The created THREE.Mesh instance representing the billboarding text. For convenience, this is typed as {@link Text}.
	 */
	textBillboard = (
		value: string,
		size?: number | null,
		color?: ObjectColor,
		direction?: "ltr" | "rtl" | "tb"
	) => {
		const textMesh = this.text(value, size, color, direction);

		const rotate = () => {
			const cameraRotation = this.camera.quaternion.clone();
			textMesh.quaternion.copy(cameraRotation);
		};

		if (this.mode !== "IMMEDIATE") {
			this.update(rotate);
		} else {
			rotate();
		}

		return textMesh;
	};

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
		config?: { step?: number; showValue?: boolean }
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
			valueLabel
		);
	};

	/**
	 * Creates and adds a line to the scene.
	 * ### Example
	 * ```js
	 * ctx.line([0, 0, 0], [10, 10, 10]); // Uses default foreground color
	 * ctx.line(vec3(0, 0, 0), vec3(10, 0, 0), "dashed");
	 * ctx.line([0, 0, 0], [0, 10, 0], { color: "red", dashSize: 5, gapSize: 2 });
	 * ```
	 * @param start A vector representing the start point of the line.
	 * @param end A vector representing the end point of the line.
	 * @param style (Optional) The style of the line. Can be "dashed", a color representation, or an object specifying color, dashSize, gapSize or linewidth. Defaults to the context's foreground color.
	 * @returns The created THREE.Line instance. For convenience, this is typed as {@link Line}.
	 */
	line = (start: Vec3, end: Vec3, style?: LineStyle): Line2 => {
		return this.lineStrip([start, end], style);
	};

	/**
	 * Creates and adds a line strip to the scene.
	 * ### Example
	 * ```js
	 * ctx.lineStrip([[0, 0, 0], [10, 0, 0], [10, 10, 0]]); // Uses default foreground color
	 * ctx.lineStrip([[0, 0, 0], [10, 0, 0], [10, 10, 0]], "dashed");
	 * ctx.lineStrip([[0, 0, 0], [10, 0, 0], [10, 10, 0]], { color: "blue", dashSize: 3, gapSize: 1 });
	 * ```
	 * @param points An array of vectors representing the points of the line strip.
	 * @param style (Optional) The style of the line. Can be "dashed", a color representation, or an object specifying color, dashSize, gapSize or linewidth. Defaults to the context's foreground color.
	 * @returns The created THREE.Line instance. For convenience, this is typed as {@link Line}.
	 */
	lineStrip = (points: Vec3[], style?: LineStyle): Line2 => {
		const vecPoints = points.map(toVec3);

		const geometry = new LineGeometry().setFromPoints(vecPoints);

		const lineStyle = toLineStyle(style);
		const dashed =
			lineStyle.dashSize !== undefined && lineStyle.gapSize !== undefined;
		const material = new LineMaterial({
			color: lineStyle.color ?? this.COLOR.FOREGROUND,
			dashSize: lineStyle.dashSize ?? 0,
			gapSize: lineStyle.gapSize ?? 0,
			linewidth: lineStyle.lineWidth ?? 2,
			dashed,
		});

		const line = new Line2(geometry, material);
		line.computeLineDistances();
		this.spawn(line);
		return line;
	};

	/**
	 * Creates and adds an arrow to the scene.
	 * ### Example
	 * ```js
	 * ctx.arrow([0, 0, 0], [10, 10, 10]); // Uses default foreground color
	 * ctx.arrow([0, 0, 0], [10, 0, 0], "red");
	 * ```
	 * @param start The start point of the arrow.
	 * @param end The end point of the arrow.
	 * @param style (Optional) The style of the line. Can be "dashed", a color representation, or an object specifying color, dashSize, gapSize or linewidth. Defaults to the context's foreground color.
	 * @returns The created THREE.ArrowHelper instance.
	 */
	arrow = (start: Vec3, end: Vec3, style?: LineStyle) => {
		const startVec = toVec3(start);
		const endVec = toVec3(end);

		const vec = endVec.clone().sub(startVec);
		const length = vec.length();
		const dir = endVec.clone().sub(startVec).normalize();

		const lineStyle = toLineStyle(style);
		const color = lineStyle.color ?? this.COLOR.FOREGROUND;

		const line = this.line(
			[0, 0, 0],
			DIR.Y.multiplyScalar(length - 12),
			lineStyle
		);
		const cone = this.cone([0, 0, 0], 12, 6, color);
		cone.geometry.translate(0, length - 6, 0);

		const arrow = new Arrow(startVec, dir, line, cone);
		this.spawn(arrow);

		return arrow;
	};

	/**
	 * Creates an arrow starting from the origin (0, 0, 0) to the given vector.
	 * ### Example
	 * ```js
	 * ctx.vector([10, 10, 10]); // Uses default foreground color
	 * ctx.vector(vec3(10, 0, 0), "blue");
	 * ```
	 * @param vec The vector to be drawn.
	 * @param style (Optional) The style of the line. Can be "dashed", a color representation, or an object specifying color, dashSize, gapSize or linewidth. Defaults to the context's foreground color.
	 * @returns The created THREE.ArrowHelper instance.
	 */
	vector = (vec: Vec3, style?: LineStyle) => {
		return this.arrow(vec3(0, 0, 0), vec, style);
	};

	/**
	 * Creates and adds a cuboid (rectangular box) to the scene.
	 * ### Example
	 * ```js
	 * ctx.cuboid([0, 0, 0], [10, 5, 3]);
	 * ctx.cuboid(vec3(5, 5, 5), vec3(2, 4, 6), "green");
	 * ```
	 * @param position A vector representing the position of the cuboid's center.
	 * @param size A vector representing the width, height and depth of the cuboid.
	 * @param color (Optional) Object color. See {@link ObjectColor} for details.
	 * @returns The created THREE.Mesh instance representing the cuboid.
	 */
	cuboid = (position: Vec3, size: Vec3, color?: ObjectColor) => {
		const pos = toVec3(position);
		const sizeVec = toVec3(size);
		const geometry = new THREE.BoxGeometry(sizeVec.x, sizeVec.y, sizeVec.z);
		const material = toMaterial(color, this.COLOR.FOREGROUND);
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.copy(pos);
		this.spawn(mesh);
		return mesh;
	};

	/**
	 * Creates and adds a circle to the scene.
	 * ### Example
	 * ```js
	 * ctx.circle([0, 0, 0], 5);
	 * ctx.circle(vec3(10, 10, 0), 8, "blue");
	 * ```
	 * @param position A vector representing the position of the circle's center.
	 * @param radius The radius of the circle.
	 * @param color (Optional) Object color. See {@link ObjectColor} for details.
	 * @returns The created THREE.Mesh instance representing the circle.
	 */
	circle = (position: Vec3, radius: number, color?: ObjectColor) => {
		const pos = toVec3(position);
		const geometry = new THREE.CircleGeometry(radius);
		const material = toMaterial(color, this.COLOR.FOREGROUND);
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.copy(pos);
		this.spawn(mesh);
		return mesh;
	};

	/**
	 * Creates and adds a cylinder to the scene.
	 * ### Example
	 * ```js
	 * ctx.cylinder([0, 0, 0], 5, 5, 10);
	 * ctx.cylinder(vec3(10, 10, 0), 4, 6, 12, "green");
	 * ```
	 * @param position A vector representing the position of the cylinder's center.
	 * @param radiusTop The radius of the cylinder at the top.
	 * @param radiusBottom The radius of the cylinder at the bottom.
	 * @param height The height of the cylinder.
	 * @param color (Optional) Object color. See {@link ObjectColor} for details.
	 * @returns The created THREE.Mesh instance representing the cylinder.
	 */
	cylinder = (
		position: Vec3,
		radiusTop: number,
		radiusBottom: number,
		height: number,
		color?: ObjectColor
	) => {
		const pos = toVec3(position);
		const geometry = new THREE.CylinderGeometry(
			radiusTop,
			radiusBottom,
			height
		);
		const material = toMaterial(color, this.COLOR.FOREGROUND);
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.copy(pos);
		this.spawn(mesh);
		return mesh;
	};

	/**
	 * Creates and adds a plane to the scene.
	 * ### Example
	 * ```js
	 * ctx.plane([0, 0, 0], [10, 5]);
	 * ctx.plane(vec3(10, 10, 0), vec2(8, 4), "gray");
	 * ```
	 * @param position A vector representing the position of the plane's center.
	 * @param size A vector representing the width and height of the plane.
	 * @param color (Optional) Object color. See {@link ObjectColor} for details.
	 * @returns The created THREE.Mesh instance representing the plane.
	 */
	plane = (position: Vec3, size: Vec2, color?: ObjectColor) => {
		const pos = toVec3(position);
		const sizeVec = toVec2(size);
		const geometry = new THREE.PlaneGeometry(sizeVec.x, sizeVec.y);
		const material = toMaterial(color, this.COLOR.FOREGROUND);
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.copy(pos);
		this.spawn(mesh);
		return mesh;
	};

	/**
	 * Creates and adds a torus to the scene.
	 * ### Example
	 * ```js
	 * ctx.torus([0, 0, 0], 10, 3);
	 * ctx.torus(vec3(5, 5, 5), 8, 2, "purple");
	 * ```
	 * @param position A vector representing the position of the torus's center.
	 * @param radius The radius from the center of the torus to the center of the tube.
	 * @param tubeRadius The radius of the tube.
	 * @param color (Optional) Object color. See {@link ObjectColor} for details.
	 * @returns The created THREE.Mesh instance representing the torus.
	 */
	torus = (
		position: Vec3,
		radius: number,
		tubeRadius: number,
		color?: ObjectColor
	) => {
		const pos = toVec3(position);
		const geometry = new THREE.TorusGeometry(radius, tubeRadius);
		const material = toMaterial(color, this.COLOR.FOREGROUND);
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.copy(pos);
		this.spawn(mesh);
		return mesh;
	};

	/**
	 * Creates and adds a sphere to the scene.
	 * ### Example
	 * ```js
	 * ctx.sphere([0, 0, 0], 3); // Uses default foreground color
	 * ctx.sphere(vec3(0, 0, 0), 5, "red");
	 * ```
	 * @param position A vector representing the position of the sphere.
	 * @param radius The radius of the sphere.
	 * @param color (Optional) Object color. See {@link ObjectColor} for details.
	 * @returns The created THREE.Mesh instance representing the sphere. For convenience, this is typed as {@link Sphere}.
	 */
	sphere = (position: Vec3, radius: number, color?: ObjectColor): Sphere => {
		const pos = toVec3(position);
		const geometry = new THREE.SphereGeometry(radius);
		const material = toMaterial(color, this.COLOR.FOREGROUND);
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.copy(pos);
		this.spawn(mesh);

		return mesh;
	};

	/**
	 * Creates and adds a cone to the scene.
	 * ### Example
	 * ```js
	 * ctx.cone(10, 5); // Uses default foreground color
	 * ctx.cone(15, 7, "green");
	 * ```
	 * @param height Height of the cone from base to tip
	 * @param radius Radius of the cone base
	 * @param color (Optional) Object color. See {@link ObjectColor} for details.
	 * @returns The created THREE.Mesh instance representing the cone. For convenience, this is typed as {@link Cone}.
	 */
	cone = (
		position: Vec3,
		height: number,
		radius: number,
		color?: ObjectColor
	): Cone => {
		const pos = toVec3(position);
		const geometry = new THREE.ConeGeometry(radius, height);
		const material = toMaterial(color, this.COLOR.FOREGROUND);
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.copy(pos);
		this.spawn(mesh);

		return mesh;
	};

	// TODO: Add min/max, so that calculated values that exceed NaN or Infinity can be clamped. Otherwise, length
	// computation fails
	/**
	 * Creates and adds a graph of a mathematical function to the scene.
	 * ### Example
	 * ```js
	 * // Graph a sine wave from -10 to 10
	 * ctx.graph(x => Math.sin(x), "dashed", [-10, 10]);
	 * // Graph a quadratic function over the default range
	 * ctx.graph(x => x * x, { color: "blue", dashSize: 5, gapSize: 2 });
	 * ```
	 * @param func The mathematical function to graph.
	 * @param style (Optional) The style of the line. Can be "dashed", a color representation, or an object specifying color, dashSize, gapSize or linewidth. Defaults to the context's foreground color.
	 * @param range (Optional) The range [from, to] over which to graph the function.
	 * @returns The created THREE.Line instance representing the graph. For convenience, this is typed as {@link Line}.
	 */
	graph = (
		func: (x: number) => number,
		style?: LineStyle,
		range?: [number, number]
	) => {
		const { x: scaleX, y: scaleY, z: scaleZ } = this.camera.scale;
		const scale = Math.min(scaleX, scaleY, scaleZ);

		const cameraExtent = this.getCameraExtent() * scale;
		const from = range?.[0] ?? -cameraExtent;
		const to = range?.[1] ?? cameraExtent;

		if (from >= to) {
			throw new Error("Invalid range: 'to' must be greater than 'from'");
		}

		// At scale 1, we want approximately one point every 2 screen pixels
		const resolution = 0.5 / scale;
		const pointCount = Math.round((to - from) * resolution);
		const points: Vec3[] = [];
		for (let i = 0; i <= pointCount; i++) {
			const x = from + (i / pointCount) * (to - from);
			const y = func(x);
			points.push([x, y, 0]);
		}

		return this.lineStrip(points, style);
	};

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
		normal?: Vec3
	) => {
		const gridSize = size ?? this.getCameraExtent();
		const divisions = gridSize / (spacing ?? 50);

		const gridHelper = new THREE.GridHelper(
			gridSize,
			divisions,
			color ?? this.COLOR.SECONDARY,
			color ?? this.COLOR.SECONDARY
		);

		const rotation = new THREE.Quaternion();
		rotation.setFromUnitVectors(vec3(0, 1, 0), toVec3(normal ?? [0, 1, 0]));
		gridHelper.quaternion.copy(rotation);

		this.spawn(gridHelper);
		return gridHelper;
	};

	/**
	 * An efficient way to render large point clouds.
	 * ### Example
	 * ```js
	 * const pts = new Array(1000).fill(vec3(0, 0, 0));
	 * const points = ctx.points(pts, 3, "red");
	 *
	 * const point = points.getPosition(0); // Get position of first point
	 * points.setPosition(0, vec3(10, 10, 10)); // Move first point
	 *
	 * console.log(`Point count: ${points.count}`);
	 *
	 * const color = points.getColor(0); // Get color of first point
	 * points.setColor(0, "blue");
	 * ```
	 * @param points Array of point positions.
	 * @param size Size of the points. Defaults to 2. All points are squares facing the camera.
	 * @param color Color of the points. Defaults to the context's foreground color.
	 * @returns Points helper object.
	 */
	points = (
		points: Vec3[],
		size?: number | null,
		color?: THREE.ColorRepresentation
	): Points => {
		const pointCloud = new Points(
			points,
			size ?? 2,
			new THREE.Color(color ?? this.COLOR.FOREGROUND)
		);
		this.spawn(pointCloud.innerPoints);
		return pointCloud;
	};

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
}
