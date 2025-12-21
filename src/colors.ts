import { color } from "./utils.ts";

// The reason why we're using getters here is to ensure that the returned colors are new instances each time
// they are accessed. Returning a static color causes issues, for example when trying to lerp between colors 🤷

export const lightColors = {
	get FOREGROUND() {
		return color("#0a0a0a");
	},
	get SECONDARY() {
		return color("#e5e5e5");
	},
	get BACKGROUND() {
		return color("#ffffff");
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
		return color("#f0f0f0");
	},
	get SECONDARY() {
		return color("#333333");
	},
	get BACKGROUND() {
		return color("#0a0a0a");
	},
	gray: lightColors.gray,
};
