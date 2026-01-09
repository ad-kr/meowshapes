import { Ctx, THREE, type Vec3 } from "../index.ts";
import type { RendererObject } from "./index.ts";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { toVec3 } from "../vecUtils.ts";

export type LineStripColor =
	| THREE.ColorRepresentation
	| { from: THREE.ColorRepresentation; to: THREE.ColorRepresentation }
	| THREE.ColorRepresentation[];

export class LineStrip implements RendererObject<LineStripColor> {
	/**
	 * The Line2 mesh representing the line strip.
	 */
	mesh: Line2;

	/** Reference to the rendering context. */
	private ctxRef: Ctx;

	/** Number of points in the line strip. */
	private pointCount: number;

	constructor(ctx: Ctx, points: Vec3[]) {
		this.ctxRef = ctx;
		this.pointCount = points.length;

		const pointArray = points.map(toVec3);
		const geometry = new LineGeometry().setFromPoints(pointArray);
		const material = new LineMaterial({
			linewidth: 2,
			color: ctx.COLOR.FOREGROUND,
		});

		this.mesh = new Line2(geometry, material);
		this.mesh.computeLineDistances();

		ctx.spawn(this.mesh);
	}

	pos(position: Vec3): this {
		this.mesh.position.copy(toVec3(position));
		return this;
	}

	/**
	 * Set the color of the line strip.
	 * @param color A color, an array of colors or an object defining from/to colors.
	 */
	color(color: LineStripColor): this {
		const pointCount = this.pointCount;

		if (Array.isArray(color)) {
			if (color.length !== pointCount) {
				throw new Error(
					`Color array length must match point count. Expected ${pointCount}, got ${color.length}.`
				);
			}

			const vertexColors = new Float32Array(pointCount * 3);

			for (let i = 0; i < pointCount; i++) {
				const c = new THREE.Color(color[i]);
				vertexColors[i * 3] = c.r;
				vertexColors[i * 3 + 1] = c.g;
				vertexColors[i * 3 + 2] = c.b;
			}

			this.mesh.geometry.setColors(vertexColors);
			this.mesh.material.vertexColors = true;
			this.mesh.material.color = new THREE.Color(0xffffff);
			return this;
		} else if (
			typeof color === "object" &&
			"from" in color &&
			"to" in color
		) {
			const vertexColors = new Float32Array(pointCount * 3);
			const fromColor = new THREE.Color(color.from);
			const toColor = new THREE.Color(color.to);

			for (let i = 0; i < pointCount; i++) {
				const t = i / (pointCount - 1);
				const c = fromColor.clone().lerp(toColor, t);
				vertexColors[i * 3] = c.r;
				vertexColors[i * 3 + 1] = c.g;
				vertexColors[i * 3 + 2] = c.b;
			}

			this.mesh.geometry.setColors(vertexColors);
			this.mesh.material.vertexColors = true;
			this.mesh.material.color = new THREE.Color(0xffffff);
			return this;
		}

		const c = new THREE.Color(color);

		this.mesh.material.color = c;
		this.mesh.material.vertexColors = false;

		return this;
	}

	/**
	 * Sets the material of the line strip.
	 * @param material A LineMaterial instance.
	 */
	material(material: LineMaterial): this {
		this.mesh.material = material;
		return this;
	}

	/**
	 * Sets the line width of the line strip.
	 * @param width The new line width.
	 */
	linewidth(width: number): this {
		this.mesh.material.linewidth = width;
		return this;
	}

	/**
	 * Sets the line to be dashed. If no parameters are provided, default values are used.
	 * @param dashSize Size of the dashes.
	 * @param gapSize Size of the gaps between dashes.
	 */
	dashed(dashSize?: number, gapSize?: number): this {
		const scale = 1 / this.ctxRef.zoom();
		this.mesh.material.gapSize = gapSize ?? 20 * scale;
		this.mesh.material.dashSize = dashSize ?? 10 * scale;
		this.mesh.material.dashed = true;
		return this;
	}
}
