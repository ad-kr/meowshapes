import { Ctx } from "./ctx.ts";
import { THREE } from "./index.ts";

export class Renderer {
	/** The inner THREE.js WebGLRenderer instance. This is only created once per Renderer instance. */
	private readonly inner: THREE.WebGLRenderer;

	constructor(setup: (ctx: Ctx) => void) {
		this.inner = new THREE.WebGLRenderer({ antialias: true });

		const scene = new THREE.Scene();
		const ctx = new Ctx(scene);

		scene.background = ctx.COLORS.BACKGROUND;

		setup(ctx);

		const width = window.innerWidth;
		const height = window.innerHeight;

		const camera = new THREE.OrthographicCamera(
			-width / 2,
			width / 2,
			height / 2,
			-height / 2,
			-1000000,
			1000000
		);

		camera.position.x = -100;
		camera.position.y = 100;
		camera.position.z = 100;
		camera.lookAt(0, 0, 0);

		this.inner.setPixelRatio(window.devicePixelRatio);
		this.inner.setSize(width, height);
		this.inner.render(scene, camera);

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
			this.inner.render(scene, camera);
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
