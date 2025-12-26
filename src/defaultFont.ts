// `with { type: "json" }` messes up with our formatter, so we put this in a separate file and re-export it
import DefaultFont from "../src/Google_Sans_Code_Regular.json" with { type: "json" };
import type { FontData } from "three/addons/loaders/FontLoader.js";

export const defaultFont = DefaultFont as any as FontData;