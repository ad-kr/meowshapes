import { Ctx } from "./ctx.ts";
import { THREE } from "./index.ts";

export class Renderer {
	/** The inner THREE.js WebGLRenderer instance. This is only created once per Renderer instance. */
	private readonly inner: THREE.WebGLRenderer;

	/** The wrapper div containing the renderer's DOM element. */
	private readonly wrapper: HTMLDivElement;

	/** The ResizeObserver to handle resizing of the renderer. */
	private readonly resizeObserver: ResizeObserver;

	constructor(setup: (ctx: Ctx) => void) {
		this.inner = new THREE.WebGLRenderer({ antialias: true });

		this.wrapper = document.createElement("div");
		this.wrapper.style.width = "100%";
		this.wrapper.style.height = "100%";
		this.wrapper.appendChild(this.inner.domElement);

		const scene = new THREE.Scene();
		const ctx = new Ctx(scene);

		setup(ctx);

		this.resizeObserver = new ResizeObserver(() => {
			const width = this.wrapper.clientWidth;
			const height = this.wrapper.clientHeight;

			ctx.__setCameraBounds(width, height);

			this.inner.setSize(width, height);
			this.inner.render(scene, ctx.camera);
		});
		this.resizeObserver.observe(this.wrapper);

		this.inner.setPixelRatio(window.devicePixelRatio);

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

	/**
	 * Disposes of the renderer and its resources. After calling this method, the renderer should not be used
	 * anymore. Also removes the renderer's DOM element from the document if it was added.
	 */
	dispose() {
		// this.inner.dispose() alone does not free up WebGL contexts, so we force a context loss first.
		this.inner.forceContextLoss();

		this.inner.dispose();
		this.resizeObserver.disconnect();

		if (this.wrapper.parentElement) {
			this.wrapper.parentElement.removeChild(this.wrapper);
		}
	}
}
