import { Ctx } from "./ctx.ts";
import { THREE } from "./index.ts";

export class Renderer {
	/** The inner THREE.js WebGLRenderer instance. This is only created once per Renderer instance. */
	private readonly inner: THREE.WebGLRenderer;

	/** The wrapper div containing the renderer's DOM element. */
	private readonly wrapper: HTMLDivElement;

	constructor(setup: (ctx: Ctx) => void) {
		this.inner = new THREE.WebGLRenderer({ antialias: true });

		this.wrapper = document.createElement("div");
		this.wrapper.style.width = "100%";
		this.wrapper.style.height = "100%";
		this.wrapper.appendChild(this.inner.domElement);

		const scene = new THREE.Scene();
		const ctx = new Ctx(scene);

		scene.background = ctx.COLOR.BACKGROUND;

		setup(ctx);

		const resizeObserver = new ResizeObserver(() => {
			const width = this.wrapper.clientWidth;
			const height = this.wrapper.clientHeight;
			this.inner.setSize(width, height);
			ctx.__setCameraBounds(width, height);
		});
		resizeObserver.observe(this.wrapper);

		this.inner.setPixelRatio(window.devicePixelRatio);
		this.inner.render(scene, ctx.camera);

		if (!ctx.__hasUpdateFns()) return;

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
	 * Returns the DOM element used by the inner THREE.js WebGLRenderer. Add this to your document to display the
	 * rendered content. The element tries to fill the size of its parent element.
	 * @example
	 * const renderer = new Renderer(..);
	 * document.body.appendChild(renderer.element());
	 */
	element = () => this.wrapper;
}
