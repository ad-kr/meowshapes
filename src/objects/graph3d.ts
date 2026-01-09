import { Ctx, THREE, type Vec2, type Vec3 } from "../index.ts";
import { toVec2, toVec3, vec2 } from "../vecUtils.ts";
import type { HeightField, LineStrip, RendererObject } from "./index.ts";
import type { LineStripColor } from "./linestrip.ts";

type Graph3dColor =
	| THREE.ColorRepresentation
	| ((x: number, y: number, z: number) => THREE.ColorRepresentation);

export class Graph3d implements RendererObject<Graph3dColor> {
	/**
	 * The Group mesh containing the surface and any grid lines.
	 */
	mesh: THREE.Group;

	/**
	 * The HeightField object representing the 3D graph surface.
	 */
	heightField: HeightField;

	/**
	 * An array of line strips representing grid lines on the graph, if any were added.
	 */
	linestrips: LineStrip[];

	/**
	 * The computed (x, y, z) values of the 3D graph.
	 */
	values: THREE.Vector3[];

	/** Reference to the rendering context. */
	private ctxRef: Ctx;

	/** The function used to compute the graph's y values. */
	private func: (x: number, z: number) => number;

	/** Number of points along x and z axes. */
	private graphPointCount: THREE.Vector2;

	constructor(ctx: Ctx, func: (x: number, z: number) => number, size?: Vec2) {
		const defaultSize = 100 / ctx.zoom();
		const { x: width, y: depth } = toVec2(size ?? defaultSize);
		const resolution = ctx.zoom() * 0.1;

		const xSeg = Math.round(width * resolution);
		const zSeg = Math.round(depth * resolution);
		const xPoints = xSeg + 1;
		const zPoints = zSeg + 1;

		this.graphPointCount = vec2(xPoints, zPoints);

		this.values = new Array(xPoints * zPoints);

		for (let i = 0; i < zPoints; i++) {
			const z = -depth * 0.5 + (i / zSeg) * depth;
			for (let j = 0; j < xPoints; j++) {
				const x = -width * 0.5 + (j / xSeg) * width;
				const y = func(x, z);

				const index = i * xPoints + j;
				this.values[index] = new THREE.Vector3(x, y, z);
			}
		}

		const heights = this.values.map((v) => v.y);

		this.heightField = ctx.heightField(
			[width, depth],
			[xSeg, zSeg],
			heights
		);

		this.mesh = new THREE.Group();
		this.mesh.add(this.heightField.mesh);
		ctx.spawn(this.mesh);

		this.linestrips = [];
		this.func = func;
		this.ctxRef = ctx;
	}

	pos(position: Vec3): this {
		this.mesh.position.copy(toVec3(position));
		return this;
	}

	/**
	 * Sets the color of the 3D graph's surface.
	 * @param color A color or a function that returns a color based on x, y, and z values, where y is the calculated graph value at (x, z).
	 */
	color(color: Graph3dColor): this {
		if (typeof color === "function") {
			const colors = this.values.map((v) => color(v.x, v.y, v.z));
			this.heightField.color(colors);
			return this;
		}

		this.heightField.color(color);
		return this;
	}

	/**
	 * Sets the material of the 3D graph's surface.
	 * @param material The material to apply.
	 */
	material(material: THREE.Material): this {
		this.heightField.material(material);
		return this;
	}

	/**
	 * Adds a grid of line strips over the 3D graph.
	 * @param segments Number of segments in the grid along x and z axes.
	 */
	grid(segments?: Vec2): this {
		if (this.linestrips.length !== 0) return this;

		const defaultSegments = 10;
		const { x: xSeg, y: zSeg } = toVec2(segments ?? defaultSegments);
		const xPoints = xSeg + 1;
		const zPoints = zSeg + 1;

		const xGraphPoints = this.graphPointCount.x;
		const zGraphPoints = this.graphPointCount.y;
		const xGraphSeg = xGraphPoints - 1;
		const zGraphSeg = zGraphPoints - 1;

		const { width, height: depth } =
			this.heightField.mesh.geometry.parameters;

		const yOffset = 1 / this.ctxRef.zoom();

		for (let i = 0; i < xPoints; i++) {
			const x = -width * 0.5 + (i / xSeg) * width;

			const points: Vec3[] = [];
			for (let j = 0; j < zGraphPoints; j++) {
				const z = -depth * 0.5 + (j / zGraphSeg) * depth;
				const y = this.func(x, z) + yOffset;
				points.push([x, y, z]);
			}
			const line = this.ctxRef.lineStrip(points);
			this.mesh.add(line.mesh);

			this.linestrips.push(line);
		}

		for (let i = 0; i < zPoints; i++) {
			const z = -depth * 0.5 + (i / zSeg) * depth;
			const points: Vec3[] = [];
			for (let j = 0; j < xGraphPoints; j++) {
				const x = -width * 0.5 + (j / xGraphSeg) * width;
				const y = this.func(x, z) + yOffset;
				points.push([x, y, z]);
			}
			const line = this.ctxRef.lineStrip(points);
			this.mesh.add(line.mesh);

			this.linestrips.push(line);
		}

		return this;
	}

	/**
	 * Sets the color of all grid lines in the 3D graph, if grid was added.
	 * @param color A color or from/to gradient for the grid lines.
	 */
	gridColor(color: LineStripColor): this {
		this.linestrips.forEach((line) => {
			line.color(color);
		});
		return this;
	}

	/**
	 * Sets the line width of all grid lines in the 3D graph, if grid was added.
	 * @param width The new line width.
	 */
	linewidth(width: number): this {
		this.linestrips.forEach((line) => {
			line.linewidth(width);
		});
		return this;
	}

	/**
	 * Sets all grid lines in the 3D graph to be dashed, if grid was added. If no parameters are provided, default values are used.
	 * @param dashSize Size of the dashes.
	 * @param gapSize Size of the gaps between dashes.
	 */
	dashed(dashSize?: number, gapSize?: number): this {
		this.linestrips.forEach((line) => {
			line.dashed(dashSize, gapSize);
		});
		return this;
	}

	/**
	 * Removes the surface from the 3D graph, leaving only the grid lines if they were added.
	 */
	noSurface(): this {
		this.mesh.remove(this.heightField.mesh);
		return this;
	}
}
