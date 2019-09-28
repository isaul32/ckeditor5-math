import View from '@ckeditor/ckeditor5-ui/src/view';
import ViewCollection from '@ckeditor/ckeditor5-ui/src/viewcollection';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import LabeledInputView from '@ckeditor/ckeditor5-ui/src/labeledinput/labeledinputview';
import InputTextView from '@ckeditor/ckeditor5-ui/src/inputtext/inputtextview';
import LabelView from '@ckeditor/ckeditor5-ui/src/label/labelview';

import KeystrokeHandler from '@ckeditor/ckeditor5-utils/src/keystrokehandler';
import FocusTracker from '@ckeditor/ckeditor5-utils/src/focustracker';
import FocusCycler from '@ckeditor/ckeditor5-ui/src/focuscycler';

import checkIcon from '@ckeditor/ckeditor5-core/theme/icons/check.svg';
import cancelIcon from '@ckeditor/ckeditor5-core/theme/icons/cancel.svg';

import submitHandler from '@ckeditor/ckeditor5-ui/src/bindings/submithandler';

import MathView from './mathview';

import '../../theme/mathform.css';

export default class MainFormView extends View {
	constructor( locale, engine ) {
		super( locale );

		const t = locale.t;

		// Create key event & focus trackers
		this._createKeyAndFocusTrackers();

		// Equation input
		this.mathInputView = this._createMathInput();

		// Preview isn't available in katex, because .ck-reset_all * css rule breaks it
		this.previewEnabled = engine !== 'katex';

		// Display button
		this.displayButtonView = this._createDisplayButton();

		// Submit button
		this.saveButtonView = this._createButton( t( 'Save' ), checkIcon, 'ck-button-save', null );
		this.saveButtonView.type = 'submit';

		// Cancel button
		this.cancelButtonView = this._createButton( t( 'Cancel' ), cancelIcon, 'ck-button-cancel', 'cancel' );

		// Preview label
		this.previewLabel = new LabelView( locale );

		let children = [];
		if ( this.previewEnabled ) {
			this.previewLabel.text = t( 'Equation preview' );

			// Math element
			this.mathView = new MathView( engine, locale );

			children = [
				this.mathInputView,
				this.displayButtonView,
				this.previewLabel,
				this.mathView
			];
		} else {
			this.previewLabel.text = t( 'Equation preview isn\'t available' );
			children = [
				this.mathInputView,
				this.displayButtonView,
				this.previewLabel
			];
		}

		// Add UI elements to template
		this.setTemplate( {
			tag: 'form',
			attributes: {
				class: [
					'ck',
					'ck-math-form',
				],
				tabindex: '-1'
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
				this.cancelButtonView,
			],
		} );
	}

	render() {
		super.render();

		// Prevent default form submit event & trigger custom 'submit'
		submitHandler( {
			view: this,
		} );

		// Register form elements to focusable elements
		const childViews = [
			this.mathInputView,
			this.displayButtonView,
			this.saveButtonView,
			this.cancelButtonView,
		];

		childViews.forEach( v => {
			this._focusables.add( v );
			this.focusTracker.add( v.element );
		} );

		// Listen to keypresses inside form element
		this.keystrokes.listenTo( this.element );
	}

	focus() {
		this._focusCycler.focusFirst();
	}

	get equation() {
		return this.mathInputView.inputView.element.value;
	}

	set equation( equation ) {
		this.mathInputView.inputView.element.value = equation;
		if ( this.previewEnabled ) {
			this.mathView.value = equation;
		}
	}

	_createKeyAndFocusTrackers() {
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

	_createMathInput() {
		const t = this.locale.t;

		// Create equation input
		const mathInput = new LabeledInputView( this.locale, InputTextView );
		const inputView = mathInput.inputView;
		mathInput.infoText = t( 'Insert equation in TeX format.' );
		inputView.on( 'input', () => {
			if ( this.previewEnabled ) {
				this.mathView.value = inputView.element.value;
			}
		} );

		return mathInput;
	}

	_createButton( label, icon, className, eventName ) {
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

	_createDisplayButton() {
		const t = this.locale.t;

		const switchButton = new ButtonView( this.locale );

		switchButton.set( {
			label: t( 'Display mode' ),
			withText: true
		} );

		switchButton.extendTemplate( {
			attributes: {
				class: 'ck-button-display-toggle'
			}
		} );

		switchButton.bind( 'isOn' ).to( this, 'displayIsOn' );

		switchButton.on( 'execute', () => {
			// Toggle state
			this.set( 'displayIsOn', !this.displayIsOn );

			if ( this.previewEnabled ) {
				// Update preview view
				this.mathView.display = this.displayIsOn;
			}
		} );

		return switchButton;
	}
}
