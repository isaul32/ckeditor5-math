import { icons } from 'ckeditor5/src/core';
import {
	ButtonView,
	createLabeledInputText,
	FocusCycler,
	LabelView,
	LabeledFieldView,
	submitHandler,
	SwitchButtonView,
	View,
	ViewCollection,
	type InputTextView,
	type FocusableView
} from 'ckeditor5/src/ui';
import { Locale, FocusTracker, KeystrokeHandler } from 'ckeditor5/src/utils';
import { extractDelimiters, hasDelimiters } from '../utils';
import MathView from './mathview';
import '../../theme/mathform.css';
import type { KatexOptions } from '../typings-external';

const { check: checkIcon, cancel: cancelIcon } = icons;

class MathInputView extends LabeledFieldView<InputTextView> {
	public value: null | string = null;
	public isReadOnly = false;

	constructor( locale: Locale ) {
		super( locale, createLabeledInputText );
	}
}

export default class MainFormView extends View {
	public saveButtonView: ButtonView;
	public mathInputView: MathInputView;
	public displayButtonView: SwitchButtonView;
	public cancelButtonView: ButtonView;
	public previewEnabled: boolean;
	public previewLabel?: LabelView;
	public mathView?: MathView;
	public override locale: Locale = new Locale();
	public lazyLoad: undefined | ( () => Promise<void> );

	constructor(
		locale: Locale,
		engine:
			| 'mathjax'
			| 'katex'
			| ( (
				equation: string,
				element: HTMLElement,
				display: boolean,
			) => void ),
		lazyLoad: undefined | ( () => Promise<void> ),
		previewEnabled = false,
		previewUid: string,
		previewClassName: Array<string>,
		popupClassName: Array<string>,
		katexRenderOptions: KatexOptions
	) {
		super( locale );

		const t = locale.t;

		// Submit button
		this.saveButtonView = this._createButton( t( 'Save' ), checkIcon, 'ck-button-save', null );
		this.saveButtonView.type = 'submit';

		// Equation input
		this.mathInputView = this._createMathInput();

		// Display button
		this.displayButtonView = this._createDisplayButton();

		// Cancel button
		this.cancelButtonView = this._createButton( t( 'Cancel' ), cancelIcon, 'ck-button-cancel', 'cancel' );

		this.previewEnabled = previewEnabled;

		let children = [];
		if ( this.previewEnabled ) {
			// Preview label
			this.previewLabel = new LabelView( locale );
			this.previewLabel.text = t( 'Equation preview' );

			// Math element
			this.mathView = new MathView( engine, lazyLoad, locale, previewUid, previewClassName, katexRenderOptions );
			this.mathView.bind( 'display' ).to( this.displayButtonView, 'isOn' );

			children = [
				this.mathInputView,
				this.displayButtonView,
				this.previewLabel,
				this.mathView
			];
		} else {
			children = [
				this.mathInputView,
				this.displayButtonView
			];
		}

		// Add UI elements to template
		this.setTemplate( {
			tag: 'form',
			attributes: {
				class: [
					'ck',
					'ck-math-form',
					...popupClassName
				],
				tabindex: '-1',
				spellcheck: 'false'
			},
			children: [
				{
					tag: 'div',
					attributes: {
						class: [
							'ck-math-view'
						]
					},
					children
				},
				this.saveButtonView,
				this.cancelButtonView
			]
		} );
	}

	public override render(): void {
		super.render();

		// Prevent default form submit event & trigger custom 'submit'
		submitHandler( {
			view: this
		} );

		// Register form elements to focusable elements
		const childViews = [
			this.mathInputView,
			this.displayButtonView,
			this.saveButtonView,
			this.cancelButtonView
		];

		childViews.forEach( v => {
			if ( v.element ) {
				this._focusables.add( v );
				this.focusTracker.add( v.element );
			}
		} );

		// Listen to keypresses inside form element
		if ( this.element ) {
			this.keystrokes.listenTo( this.element );
		}
	}

	public focus(): void {
		this._focusCycler.focusFirst();
	}

	public get equation(): string {
		return this.mathInputView.fieldView.element?.value ?? '';
	}

	public set equation( equation: string ) {
		if ( this.mathInputView.fieldView.element ) {
			this.mathInputView.fieldView.element.value = equation;
		}
		if ( this.previewEnabled && this.mathView ) {
			this.mathView.value = equation;
		}
	}

	public focusTracker: FocusTracker = new FocusTracker();
	public keystrokes: KeystrokeHandler = new KeystrokeHandler();
	private _focusables = new ViewCollection<FocusableView>();
	private _focusCycler: FocusCycler = new FocusCycler( {
		focusables: this._focusables,
		focusTracker: this.focusTracker,
		keystrokeHandler: this.keystrokes,
		actions: {
			focusPrevious: 'shift + tab',
			focusNext: 'tab'
		}
	} );

	private _createMathInput() {
		const t = this.locale.t;

		// Create equation input
		const mathInput = new MathInputView( this.locale );
		const fieldView = mathInput.fieldView;
		mathInput.infoText = t( 'Insert equation in TeX format.' );

		const onInput = () => {
			if ( fieldView.element != null ) {
				let equationInput = fieldView.element.value.trim();

				// If input has delimiters
				if ( hasDelimiters( equationInput ) ) {
					// Get equation without delimiters
					const params = extractDelimiters( equationInput );

					// Remove delimiters from input field
					fieldView.element.value = params.equation;

					equationInput = params.equation;

					// update display button and preview
					this.displayButtonView.isOn = params.display;
				}
				if ( this.previewEnabled && this.mathView ) {
					// Update preview view
					this.mathView.value = equationInput;
				}

				this.saveButtonView.isEnabled = !!equationInput;
			}
		};

		fieldView.on( 'render', onInput );
		fieldView.on( 'input', onInput );

		return mathInput;
	}

	private _createButton(
		label: string,
		icon: string,
		className: string,
		eventName: string | null
	) {
		const button = new ButtonView( this.locale );

		button.set( {
			label,
			icon,
			tooltip: true
		} );

		button.extendTemplate( {
			attributes: {
				class: className
			}
		} );

		if ( eventName ) {
			button.delegate( 'execute' ).to( this, eventName );
		}

		return button;
	}

	private _createDisplayButton() {
		const t = this.locale.t;

		const switchButton = new SwitchButtonView( this.locale );

		switchButton.set( {
			label: t( 'Display mode' ),
			withText: true
		} );

		switchButton.extendTemplate( {
			attributes: {
				class: 'ck-button-display-toggle'
			}
		} );

		switchButton.on( 'execute', () => {
			// Toggle state
			switchButton.isOn = !switchButton.isOn;

			if ( this.previewEnabled && this.mathView ) {
				// Update preview view
				this.mathView.display = switchButton.isOn;
			}
		} );

		return switchButton;
	}
}
