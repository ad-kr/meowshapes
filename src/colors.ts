import { color } from "./utils.ts";

export type Theme = "light" | "dark";

export const cssColors = {
	light: {
		foreground: "#0a0a0a",
		muted: "#333333",
		secondary: "#e5e5e5",
		background: "#ffffff",
	},
	dark: {
		foreground: "#ffffff",
		muted: "#e5e5e5",
		secondary: "#333333",
		background: "#0a0a0a",
	},
};

// The reason why we're using getters here is to ensure that the returned colors are new instances each time
// they are accessed. Returning a static color causes issues, for example when trying to lerp between colors 🤷

export const lightColors = {
	get FOREGROUND() {
		return color(cssColors.light.foreground);
	},
	get MUTED() {
		return color(cssColors.light.muted);
	},
	get SECONDARY() {
		return color(cssColors.light.secondary);
	},
	get BACKGROUND() {
		return color(cssColors.light.background);
	},
	/**
	 * Interpolation between FOREGROUND and BACKGROUND colors given a factor between 0 and 1.
	 * @param factor A number between 0 and 1 representing the interpolation factor, where 0 returns BACKGROUND and 1 returns FOREGROUND.
	 * @returns A THREE.Color instance representing the interpolated color.
	 */
	gray(factor: number) {
		return this.BACKGROUND.lerp(this.FOREGROUND, factor);
	},
};

export const darkColors = {
	get FOREGROUND() {
		return color(cssColors.dark.foreground);
	},
	get MUTED() {
		return color(cssColors.dark.muted);
	},
	get SECONDARY() {
		return color(cssColors.dark.secondary);
	},
	get BACKGROUND() {
		return color(cssColors.dark.background);
	},
	gray: lightColors.gray,
};
