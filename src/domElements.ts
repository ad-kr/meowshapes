/**
 * A container for references to the DOM elements used in a slider.
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

/**
 * A container for references to the DOM elements used in a checkbox.
 */
export class Checkbox {
	/** The container that contains the label and the input checkbox */
	container: HTMLDivElement;

	/** The input checkbox element */
	checkbox: HTMLInputElement;

	/** The label element for the checkbox */
	label: HTMLLabelElement | null;

	constructor(
		container: HTMLDivElement,
		checkbox: HTMLInputElement,
		label: HTMLLabelElement | null
	) {
		this.container = container;
		this.checkbox = checkbox;
		this.label = label;
	}

	/** Returns whether the checkbox is checked */
	value = (): boolean => {
		return this.checkbox.checked;
	};

	/** Sets the checked state of the checkbox */
	setValue = (value: boolean) => {
		this.checkbox.checked = value;
	};
}
