import { Ctx, THREE, type Vec3 } from "../index.ts";
import type { Cone, LineStrip, RendererObject } from "./index.ts";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { DIR, toVec3, vec3 } from "../vecUtils.ts";

type ArrowColor =
	| THREE.ColorRepresentation
	| { from: THREE.ColorRepresentation; to: THREE.ColorRepresentation };

export class Arrow implements RendererObject<ArrowColor> {
	/**
	 * The Group mesh containing the line and cone of the arrow.
	 */
	mesh: THREE.Group;

	/** The line part of the arrow. */
	line: LineStrip;

	/** The cone part of the arrow. */
	cone: Cone;

	constructor(ctx: Ctx, from: Vec3, to: Vec3, headLength?: number) {
		const fromVec = toVec3(from);
		const toVec = toVec3(to);
		const dir = toVec.clone().sub(fromVec).normalize();
		const length = fromVec.distanceTo(toVec);

		const scale = 1 / ctx.zoom();
		const calculatedHeadLength =
			headLength !== undefined ? headLength : 12 * scale;

		this.line = ctx.line(
			0,
			DIR.Y.multiplyScalar(length - calculatedHeadLength)
		);
		this.cone = ctx.cone(calculatedHeadLength * 0.5, calculatedHeadLength);

		this.cone.mesh.geometry.translate(
			0,
			length - calculatedHeadLength * 0.5,
			0
		);

		this.line.mesh.matrixAutoUpdate = false;
		this.cone.mesh.matrixAutoUpdate = false;

		this.mesh = new THREE.Group();
		this.mesh.position.copy(fromVec);
		this.mesh.add(this.line.mesh);
		this.mesh.add(this.cone.mesh);

		if (dir.y > 0.9999) {
			this.mesh.quaternion.set(0, 0, 0, 1);
		} else if (dir.y < -0.9999) {
			this.mesh.quaternion.set(1, 0, 0, 0);
		} else {
			const axis = vec3(dir.z, 0, -dir.x).normalize();
			const angle = Math.acos(dir.y);
			this.mesh.quaternion.setFromAxisAngle(axis, angle);
		}

		ctx.spawn(this.mesh);
	}

	pos(position: Vec3): this {
		this.mesh.position.copy(toVec3(position));
		return this;
	}

	/**
	 * Sets the color of the arrow.
	 * @param color A color or an object defining from/to colors.
	 */
	color(color: ArrowColor): this {
		const headColor =
			typeof color === "object" && "to" in color ? color.to : color;
		this.cone.color(headColor);
		this.line.color(color);
		return this;
	}

	/**
	 * Sets the material of the arrow.
	 * @param material The new material for the arrow.
	 */
	material(material: LineMaterial): this {
		this.line.material(material);
		this.cone.material(material);
		return this;
	}

	/**
	 * Sets the line width of the arrow.
	 * @param width The new line width.
	 */
	linewidth(width: number): this {
		this.line.linewidth(width);
		return this;
	}

	/**
	 * Sets the arrow line to be dashed. If no parameters are provided, default values are used.
	 * @param dashSize Size of the dashes.
	 * @param gapSize Size of the gaps between dashes.
	 */
	dashed(dashSize?: number, gapSize?: number): this {
		this.line.dashed(dashSize, gapSize);
		return this;
	}
}
