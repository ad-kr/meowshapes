export { Renderer } from "./renderer.ts";
export { Ctx } from "./ctx.ts";
export {
	vec2,
	vec3,
	vec4,
	color,
	DIR,
	type Vec2,
	type Vec3,
	type Vec4,
} from "./utils.ts";
export type { Sphere, Line, Text } from "./shapeTypes.ts";

// TODO: Still wondering whether we should re-export THREE or not.
export * as THREE from "three";
