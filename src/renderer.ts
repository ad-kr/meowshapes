import { cssColors } from "./colorUtils.ts";
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
		this.wrapper.className = "renderer-wrapper";
		this.wrapper.appendChild(this.inner.domElement);

		const stylesId = "renderer-styles";
		if (document.getElementById(stylesId) === null) {
			const style = document.createElement("style");
			style.id = stylesId;

			// Some remarks about styling:
			// - We use margin-top and margin-left on children instead of gap to also add some spcaing from the edges
			// without having to add padding to the wrapper. This way we can keep canvas and other elements in the same
			// wrapper.
			style.innerText = `
                .renderer-wrapper {
                    position: relative;
                    width: 100%;
                    height: 100%;

                    display: flex;
                    flex-direction: column;
                    flex-wrap: wrap;
                    align-items: start;
                    align-content: start;

                    overflow: hidden;
                }
                .renderer-wrapper > * {
                    margin-top: 16px;
                    margin-left: 16px;
                }
                .renderer-wrapper > canvas {
                    position: absolute;
                    z-index: -1;
                    margin: 0;
                }
                .renderer-button {
                    font-family: Geist, sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    color: ${cssColors.light.background};

                    background-color: ${cssColors.light.foreground};
                    border: none;
                    border-radius: 8px;

                    padding: 8px 16px;
                    cursor: pointer;
                }
                .renderer-button:hover {
                    background-color: ${cssColors.light.muted};
                }
                .renderer-button.dark {
                    background-color: ${cssColors.dark.foreground};
                    color: ${cssColors.dark.background};
                }
                .renderer-button.dark:hover {
                    background-color: ${cssColors.dark.muted};
                }
                
                .renderer-slider-container {
                    display: flex;
                    flex-direction: column;
                    
                    font-family: Geist, sans-serif;
                    font-size: 12px;
                    font-weight: 500;
                    color: ${cssColors.light.foreground};

                    gap: 4px;
                }
                .renderer-slider-container.dark {
                    color: ${cssColors.dark.foreground};
                }
                .renderer-slider-container > div {
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                }
                .renderer-slider-container > input[type="range"] {
                    -webkit-appearance: none;
                    appearance: none;

                    margin: 6px 0;

                    height: 4px;
                    border-radius: 2px;

                    background: ${cssColors.light.muted};
                }
                .renderer-slider-container.dark > input[type="range"] {
                    background: ${cssColors.dark.muted};
                }
                .renderer-slider-container > input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: ${cssColors.light.foreground};
                    cursor: pointer;
                }
                .renderer-slider-container.dark > input[type="range"]::-webkit-slider-thumb {
                    background: ${cssColors.dark.foreground};
                }

                .renderer-text-element {
                    font-family: Geist, sans-serif;
                    font-weight: 500;
                }

                .renderer-checkbox-container {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    
                    font-family: Geist, sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    color: ${cssColors.light.foreground};
                }
                .renderer-checkbox-container.dark {
                    color: ${cssColors.dark.foreground};
                }
                .renderer-checkbox-container > input[type="checkbox"] {
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                }
                .renderer-checkbox-container > input[type="checkbox"]::checked {
                    background-color: ${cssColors.light.foreground};
                }
                .renderer-checkbox-container.dark > input[type="checkbox"]::checked {
                    background-color: ${cssColors.dark.foreground};
                }
                .renderer-checkbox-container > label {
                    cursor: pointer;
                }
            `;

			document.head.appendChild(style);
		}

		const scene = new THREE.Scene();
		const ctx = new Ctx(scene, this.wrapper);

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
	 * ### Example
	 * ```js
	 * const renderer = new Renderer(..);
	 * document.body.appendChild(renderer.element());
	 * ```
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
