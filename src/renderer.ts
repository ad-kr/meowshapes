import { Ctx } from "./ctx.ts";
import { THREE } from "./index.ts";

export class Renderer {
	/** The inner THREE.js WebGLRenderer instance. This is only created once per Renderer instance. */
	private readonly inner: THREE.WebGLRenderer;

	constructor(setup: (ctx: Ctx) => void) {
		this.inner = new THREE.WebGLRenderer({ antialias: true });

		const width = window.innerWidth;
		const height = window.innerHeight;

		const scene = new THREE.Scene();
		const ctx = new Ctx(scene, [width, height]);

		scene.background = ctx.COLORS.BACKGROUND;

		setup(ctx);

		this.inner.setPixelRatio(window.devicePixelRatio);
		this.inner.setSize(width, height);
		this.inner.render(scene, ctx.camera);

		let lastMs: number | null = null;
		let elapsedSecs = 0;

		this.inner.setAnimationLoop((elapsedMs) => {
			let deltaSecs = 0;
			if (lastMs !== null) {
				deltaSecs = (elapsedMs - lastMs) / 1000;
				elapsedSecs += deltaSecs;
			}
			lastMs = elapsedMs;

			ctx.__tick(deltaSecs, elapsedSecs);
			this.inner.render(scene, ctx.camera);
		});
	}

	/**
	 * Returns the DOM element used by the inner THREE.js WebGLRenderer. Add this
	 * @example
	 * const renderer = new Renderer(..);
	 * document.body.appendChild(renderer.element());
	 */
	element = () => this.inner.domElement;
}
