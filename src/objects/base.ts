import { THREE, type Ctx, type Vec3 } from "../index.ts";
import { toVec3 } from "../vecUtils.ts";

export interface RendererObject<ColorType> {
	/**
	 * Set the position of the object.
	 * @param position A vector-like object representing the position.
	 */
	pos(position: Vec3): this;

	/**
	 * Set the color of the object.
	 * @param color A color input for this object.
	 */
	color(color: ColorType): this;

	/**
	 * Set the material of the object.
	 * @param material A THREE.Material instance.
	 */
	material(material: THREE.Material): this;
}

export abstract class BasicObject<Geometry extends THREE.BufferGeometry>
	implements RendererObject<THREE.ColorRepresentation>
{
	/** The THREE.Mesh instance representing this object. */
	mesh: THREE.Mesh<Geometry>;

	/** Reference to the rendering context. */
	protected ctxRef: Ctx;

	constructor(ctx: Ctx, geometry: Geometry) {
		const material = new THREE.MeshBasicMaterial({
			color: ctx.COLOR.FOREGROUND,
		});
		this.mesh = new THREE.Mesh(geometry, material);
		this.ctxRef = ctx;
	}

	pos(position: Vec3): this {
		this.mesh.position.copy(toVec3(position));
		return this;
	}

	color(color: THREE.ColorRepresentation): this {
		if (this.getMaterialColor() !== null) {
			// @ts-ignore We just checked that the color exists
			this.mesh.material.color = new THREE.Color(color);
		}
		return this;
	}

	material(material: THREE.Material): this {
		this.mesh.material = material;
		return this;
	}

	/**
	 * Configures the object to use a shaded material.
	 */
	shaded(): this {
		const color = this.getMaterialColor() ?? this.ctxRef.COLOR.FOREGROUND;
		this.material(new THREE.MeshStandardMaterial({ color }));
		return this;
	}

	/**
	 * Returns the color used in the material of the object, if one exists.
	 */
	protected getMaterialColor(): THREE.Color | null {
		if (
			this.mesh.material instanceof THREE.Material &&
			"color" in this.mesh.material &&
			this.mesh.material.color instanceof THREE.Color
		) {
			return this.mesh.material.color;
		}
		return null;
	}
}
