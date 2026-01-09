import { vec2, type Ctx, type THREE, type Vec3 } from "../index.ts";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import type { LineStrip, RendererObject } from "./index.ts";

type GraphColor =
	| THREE.ColorRepresentation
	| ((x: number, y: number) => THREE.ColorRepresentation);

export class Graph implements RendererObject<GraphColor> {
	/**
	 * The underlying LineStrip mesh representing the graph.
	 */
	linestrip: LineStrip;

	/**
	 * The computed (x, y) values of the graph.
	 */
	values: THREE.Vector2[];

	constructor(
		ctx: Ctx,
		func: (x: number) => number,
		range?: [number, number]
	) {
		const defaultExtentHalf = 5000 / ctx.zoom();
		const from = range !== undefined ? range[0] : -defaultExtentHalf;
		const to = range !== undefined ? range[1] : defaultExtentHalf;

		if (from >= to) {
			throw new Error("Invalid range: 'from' must be less than 'to'.");
		}

		// At zoom 1, we want approximately one point every 2 screen pixels.
		const resolution = 0.5 * ctx.zoom();
		const pointCount = Math.round((to - from) * resolution);
		this.values = new Array(pointCount);

		for (let i = 0; i <= pointCount; i++) {
			const x = from + (i / pointCount) * (to - from);
			const y = func(x);

			if (isNaN(y) || !isFinite(y)) {
				throw new Error(
					`Graph function returned invalid value at x=${x}: ${y}`
				);
			}

			this.values[i] = vec2(x, y);
		}

		this.linestrip = ctx.lineStrip(this.values);
	}

	pos(position: Vec3): this {
		this.linestrip.pos(position);
		return this;
	}

	/**
	 * Sets the color of the graph's line strip.
	 * @param color A color or a function that returns a color based on x and y values, where y is the calculated graph value at x.
	 */
	color(color: GraphColor): this {
		const colorInput =
			typeof color === "function"
				? this.values.map(({ x, y }) => color(x, y))
				: color;

		this.linestrip.color(colorInput);
		return this;
	}

	/**
	 * Sets the material of the graph's line strip.
	 * @param material The LineMaterial to apply to the line strip.
	 */
	material(material: LineMaterial): this {
		this.linestrip.material(material);
		return this;
	}

	/**
	 * Sets the line width of the graph's line strip.
	 * @param width The new line width.
	 */
	linewidth(width: number): this {
		this.linestrip.linewidth(width);
		return this;
	}

	/**
	 * Sets the graph's line strip to be dashed. If no parameters are provided, default values are used.
	 * @param dashSize Size of the dashes.
	 * @param gapSize Size of the gaps between dashes.
	 */
	dashed(dashSize?: number, gapSize?: number): this {
		this.linestrip.dashed(dashSize, gapSize);
		return this;
	}
}
