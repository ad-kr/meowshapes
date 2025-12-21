import type { THREE } from "./index.ts";

export type Text = THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>;
export type Line = THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
export type Sphere = THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
