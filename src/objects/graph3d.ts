import { color, Ctx, THREE, type Vec2, type Vec3 } from "../index.ts";
import { toVec2, toVec3, vec2 } from "../vecUtils.ts";
import type { HeightField, RendererObject } from "./index.ts";

type Graph3dColor =
	| THREE.ColorRepresentation
	| ((x: number, y: number, z: number) => THREE.ColorRepresentation);

export class Graph3d implements RendererObject<Graph3dColor> {
	/**
	 * The HeightField object representing the 3D graph surface.
	 */
	heightField: HeightField;

	/**
	 * The computed (x, y, z) values of the 3D graph.
	 */
	values: THREE.Vector3[];

	constructor(ctx: Ctx, func: (x: number, z: number) => number, size?: Vec2) {
		const defaultSize = 100 / ctx.zoom();
		const { x: width, y: depth } = toVec2(size ?? defaultSize);
		const resolution = ctx.zoom() * 0.1;

		const xSeg = Math.round(width * resolution);
		const zSeg = Math.round(depth * resolution);
		const xPoints = xSeg + 1;
		const zPoints = zSeg + 1;

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

		const graphMaterial = new THREE.ShaderMaterial({
			vertexColors: true,
			side: THREE.DoubleSide,
			uniforms: {
				segments: { value: vec2(0.0, 0.0) },
				linewidth: { value: 1.0 },
				gridcolor: { value: color(0x000000) },
				nosurface: { value: false },
				dashsize: { value: 0.0 },
				gapsize: { value: 0.0 },
			},
			vertexShader: /* glsl */ `
                varying vec3 vColor;
                varying vec2 vUv;

                void main() {
                    vColor = color;
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
			fragmentShader: /* glsl */ `
                varying vec3 vColor;
                varying vec2 vUv;

                uniform vec2 segments;
                uniform float linewidth;
                uniform vec3 gridcolor;
                uniform bool nosurface;
                uniform float dashsize;
                uniform float gapsize;

                void main() {
                    float alpha = nosurface ? 0.0 : 1.0;
                    
                    if (segments.x <= 0.0 && segments.y <= 0.0) {
                        gl_FragColor = vec4(vColor, alpha);
                        gl_FragColor = linearToOutputTexel( gl_FragColor );
                        return;
                    }
                    
                    vec2 gridUv = vUv * segments;
                    vec2 gridFw = max(fwidth(gridUv), 0.001);
                    vec2 grid = abs(fract(gridUv - 0.5) - 0.5) / gridFw;
                    float gridFragment = min(grid.x, grid.y);
                    float gridFactor = smoothstep(linewidth - 1.0, linewidth, gridFragment);

                    vec2 edgeFw = max(fwidth(vUv), 0.001);
                    vec2 edge = abs(fract(vUv - 0.5) - 0.5) / edgeFw;
                    float edgeFragment = min(edge.x, edge.y);
                    float edgeFactor = smoothstep(linewidth * 2.0 - 1.0, linewidth * 2.0, edgeFragment);

                    float factor = min(edgeFactor, gridFactor);

                    if (dashsize > 0.0 || gapsize > 0.0) {
                        float totalSize = dashsize + gapsize;
                        float dashFactor = mod(gl_FragCoord.x + gl_FragCoord.y, totalSize) < dashsize ? 1.0 : 0.0;
                        factor *= dashFactor;
                    }

                    vec4 color = mix(vec4(gridcolor, 1.0), nosurface ? vec4(0.0) : vec4(vColor.rgb, 1.0), factor);
                    
                    gl_FragColor = linearToOutputTexel( color );
                }
             `,
		});

		this.heightField = ctx
			.heightField([width, depth], [xSeg, zSeg], heights)
			.material(graphMaterial);
	}

	pos(position: Vec3): this {
		this.heightField.mesh.position.copy(toVec3(position));
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
		if (
			this.heightField.mesh.material instanceof THREE.ShaderMaterial &&
			"segments" in this.heightField.mesh.material.uniforms
		) {
			const gridSegments =
				segments !== undefined ? toVec2(segments) : vec2(10, 10);
			this.heightField.mesh.material.uniforms.segments.value =
				gridSegments;
		}
		return this;
	}

	/**
	 * Sets the color of all grid lines in the 3D graph, if grid was added.
	 * @param color A color or from/to gradient for the grid lines.
	 */
	gridColor(color: THREE.ColorRepresentation): this {
		if (
			this.heightField.mesh.material instanceof THREE.ShaderMaterial &&
			"gridcolor" in this.heightField.mesh.material.uniforms
		) {
			this.heightField.mesh.material.uniforms.gridcolor.value =
				new THREE.Color(color);
		}
		return this;
	}

	/**
	 * Sets the line width of all grid lines in the 3D graph, if grid was added.
	 * @param width The new line width.
	 */
	linewidth(width: number): this {
		if (
			this.heightField.mesh.material instanceof THREE.ShaderMaterial &&
			"linewidth" in this.heightField.mesh.material.uniforms
		) {
			this.heightField.mesh.material.uniforms.linewidth.value = width;
		}
		return this;
	}

	/**
	 * Removes the surface from the 3D graph, leaving only the grid lines if they were added.
	 */
	noSurface(): this {
		if (
			this.heightField.mesh.material instanceof THREE.ShaderMaterial &&
			"nosurface" in this.heightField.mesh.material.uniforms
		) {
			this.heightField.mesh.material.transparent = true;
			this.heightField.mesh.material.depthWrite = false;
			this.heightField.mesh.material.uniforms.nosurface.value = true;
		}
		return this;
	}
}
