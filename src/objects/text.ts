import { defaultFont } from "../defaultFont.ts";
import { THREE, type Ctx } from "../index.ts";
import { BasicObject } from "./index.ts";
import { FontLoader } from "three/addons/loaders/FontLoader.js";

export class Text extends BasicObject<THREE.ShapeGeometry> {
	/**  The previously saved string displayed by this object. */
	private savedText: string;

	/** The previously saved size of the text. */
	private savedSize: number;

	/** The previously saved direction of the text. */
	private savedDirection: "ltr" | "rtl" | "tb";

	constructor(ctx: Ctx, text: string) {
		if (ctx.font === null) {
			const loader = new FontLoader();
			ctx.font = loader.parse(defaultFont);
		}

		const shapes = ctx.font.generateShapes(text, 16);
		const geometry = new THREE.ShapeGeometry(shapes);
		geometry.computeBoundingBox();
		geometry.translate(
			-(geometry.boundingBox!.max.x - geometry.boundingBox!.min.x) * 0.5,
			-(geometry.boundingBox!.max.y - geometry.boundingBox!.min.y) * 0.5,
			0
		);

		super(ctx, geometry);

		this.material(
			new THREE.MeshBasicMaterial({
				color: ctx.COLOR.FOREGROUND,
				side: THREE.DoubleSide,
			})
		);

		ctx.spawn(this.mesh);

		this.savedText = text;
		this.savedSize = 16;
		this.savedDirection = "ltr";
	}

	/**
	 * Sets the size of the text.
	 * @param size The size of the text.
	 */
	size(size: number): this {
		this.reconstructGeometry({ size });
		this.savedSize = size;
		return this;
	}

	/**
	 * Sets the direction of the text.
	 * @param direction The direction of the text. Can be `ltr` (left to right), `rtl` (right to left), or `tb` (top to bottom).
	 */
	dir(direction: "ltr" | "rtl" | "tb"): this {
		this.reconstructGeometry({ direction });
		this.savedDirection = direction;
		return this;
	}

	/**
	 * Makes the text always face the camera.
	 */
	billboard(): this {
		const rotate = () => {
			const cameraRotation = this.ctxRef.camera.quaternion.clone();
			this.mesh.quaternion.copy(cameraRotation);
		};

		if (this.ctxRef.__getMode() === "RETAINED") {
			this.ctxRef.update(rotate);
		} else {
			rotate();
		}

		return this;
	}

	private reconstructGeometry(config: {
		size?: number;
		direction?: "ltr" | "rtl" | "tb";
	}) {
		const shapes = this.ctxRef.font!.generateShapes(
			this.savedText,
			config.size ?? this.savedSize,
			config.direction ?? this.savedDirection
		);

		this.mesh.geometry = new THREE.ShapeGeometry(shapes);

		this.mesh.geometry.computeBoundingBox();
		this.mesh.geometry.translate(
			-(
				this.mesh.geometry.boundingBox!.max.x -
				this.mesh.geometry.boundingBox!.min.x
			) * 0.5,
			-(
				this.mesh.geometry.boundingBox!.max.y -
				this.mesh.geometry.boundingBox!.min.y
			) * 0.5,
			0
		);
	}
}
