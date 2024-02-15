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
import type { KatexOptions } from 'katex';

const { check: checkIcon, cancel: cancelIcon } = icons;

export default class MainFormView extends View {
	public saveButtonView: ButtonView;
	public mathInputView: LabeledFieldView<InputTextView>;
	public displayButtonView: SwitchButtonView;
	public cancelButtonView: ButtonView;
	public previewEnabled: boolean;
	public previewLabel?: LabelView;
	public mathView?: MathView;
	public locale: Locale = new Locale();
	public lazyLoad: undefined | ( () => Promise<void> );

	constructor(
		locale: Locale,
		engine: 'mathjax' | 'katex' | ( ( equation: string, element: HTMLElement, display: boolean ) => void ),
		lazyLoad: undefined | ( () => Promise<void> ),
		previewEnabled: boolean = false,
		previewUid: string,
		previewClassName: Array<string>,
		popupClassName: Array<string>,
		katexRenderOptions: KatexOptions
	) {
		super( locale );

		const t = locale.t;

		// Create key event & focus trackers
		this._createKeyAndFocusTrackers();

		// Submit button
		this.saveButtonView = this._createButton(
			t( 'Save' ),
			checkIcon,
			'ck-button-save',
			null
		);
		this.saveButtonView.type = 'submit';

		// Equation input
		this.mathInputView = this._createMathInput();

		// Display button
		this.displayButtonView = this._createDisplayButton();

		// Cancel button
		this.cancelButtonView = this._createButton(
			t( 'Cancel' ),
			cancelIcon,
			'ck-button-cancel',
			'cancel'
		);

		this.previewEnabled = previewEnabled;

		let children = [];
		if ( this.previewEnabled ) {
			// Preview label
			this.previewLabel = new LabelView( locale );
			this.previewLabel.text = t( 'Equation preview' );

			// Math element
			this.mathView = new MathView(
				engine,
				lazyLoad,
				locale,
				previewUid,
				previewClassName,
				katexRenderOptions
			);
			this.mathView.bind( 'display' ).to( this.displayButtonView, 'isOn' );

			children = [
				this.mathInputView,
				this.displayButtonView,
				this.previewLabel,
				this.mathView
			];
		} else {
			children = [ this.mathInputView, this.displayButtonView ];
		}

		// Add UI elements to template
		this.setTemplate( {
			tag: 'form',
			attributes: {
				class: [ 'ck', 'ck-math-form', ...popupClassName ],
				tabindex: '-1',
				spellcheck: 'false'
			},
			children: [
				{
					tag: 'div',
					attributes: {
						class: [ 'ck-math-view' ]
					},
					children
				},
				this.saveButtonView,
				this.cancelButtonView
			]
		} );
	}

	public render(): void {
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
			this._focusables!.add( v );
			this.focusTracker!.add( v.element! );
		} );

		// Listen to keypresses inside form element
		this.keystrokes!.listenTo( this.element! );
	}

	public focus(): void {
		this._focusCycler!.focusFirst();
	}

	public get equation(): string {
		return this.mathInputView.fieldView.element?.value ?? '';
	}

	public set equation( equation: string ) {
		this.mathInputView.fieldView.element!.value = equation;
		if ( this.previewEnabled ) {
			this.mathView!.value = equation;
		}
	}

	public focusTracker: FocusTracker | null = null;
	public keystrokes: KeystrokeHandler | null = null;
	private _focusables: ViewCollection<FocusableView> | null = null;
	private _focusCycler: FocusCycler | null = null;

	public _createKeyAndFocusTrackers(): void {
		this.focusTracker = new FocusTracker();
		this.keystrokes = new KeystrokeHandler();
		this._focusables = new ViewCollection();

		this._focusCycler = new FocusCycler( {
			focusables: this._focusables,
			focusTracker: this.focusTracker,
			keystrokeHandler: this.keystrokes,
			actions: {
				focusPrevious: 'shift + tab',
				focusNext: 'tab'
			}
		} );
	}

	private _createMathInput() {
		const t = this.locale.t;

		// Create equation input
		const mathInput = new LabeledFieldView(
			this.locale,
			createLabeledInputText
		);
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
				if ( this.previewEnabled ) {
					// Update preview view
					this.mathView!.value = equationInput;
				}

				this.saveButtonView.isEnabled = !!equationInput;
			}
		};

		fieldView.on( 'render', onInput );
		fieldView.on( 'input', onInput );

		return mathInput;
	}

	private _createButton( label: string, icon: string, className: string, eventName: string | null ) {
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

			if ( this.previewEnabled ) {
				// Update preview view
				this.mathView!.display = switchButton.isOn;
			}
		} );

		return switchButton;
	}
}
