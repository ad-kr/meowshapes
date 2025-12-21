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
};
