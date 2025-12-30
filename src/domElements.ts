/**
 * A container for references to the DOM elements used in slider.
 */
export class Slider {
	/** The container that contains the label and the input slider */
	container: HTMLDivElement;

	/** The input slider element */
	slider: HTMLInputElement;

	/** The div that contains the label and value label */
	labelContainer: HTMLDivElement;

	/** The label element for the slider */
	label: HTMLLabelElement | null;

	/** The span element that displays the current value of the slider */
	valueLabel: HTMLSpanElement | null;

	constructor(
		container: HTMLDivElement,
		slider: HTMLInputElement,
		labelContainer: HTMLDivElement,
		label: HTMLLabelElement | null,
		valueLabel: HTMLSpanElement | null
	) {
		this.container = container;
		this.slider = slider;
		this.labelContainer = labelContainer;
		this.label = label;
		this.valueLabel = valueLabel;
	}

	/** Returns the current value of the slider as a number */
	value = (): number => {
		return parseFloat(this.slider.value);
	};

	/** Sets the value of the slider */
	setValue = (value: number) => {
		this.slider.value = value.toString();
	};
}
