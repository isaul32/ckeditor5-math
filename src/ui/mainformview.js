import View from '@ckeditor/ckeditor5-ui/src/view';
import ViewCollection from '@ckeditor/ckeditor5-ui/src/viewcollection';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import SwitchButtonView from '@ckeditor/ckeditor5-ui/src/button/switchbuttonview';
import LabeledInputView from '@ckeditor/ckeditor5-ui/src/labeledinput/labeledinputview';
import LabelView from '@ckeditor/ckeditor5-ui/src/label/labelview';

import KeystrokeHandler from '@ckeditor/ckeditor5-utils/src/keystrokehandler';
import FocusTracker from '@ckeditor/ckeditor5-utils/src/focustracker';
import FocusCycler from '@ckeditor/ckeditor5-ui/src/focuscycler';

import checkIcon from '@ckeditor/ckeditor5-core/theme/icons/check.svg';
import cancelIcon from '@ckeditor/ckeditor5-core/theme/icons/cancel.svg';

import submitHandler from '@ckeditor/ckeditor5-ui/src/bindings/submithandler';

import {
	delimitersAreAtBeginningAndEnd,
	delimitersAreMatching,
	delimitersCounts,
	extractDelimiters,
	getMathFormsAndText,
	hasDelimiters
} from '../utils';

import MathView from './mathview';

import '../../styles/mathform.css';
import shortcuts from './shortcutsview';
import MathInputView from "./mathinputview";

export default class MainFormView extends View {
	constructor( document, locale, engine, lazyLoad, previewEnabled,
				 previewUid, previewClassName, popupClassName, katexRenderOptions ) {
		super( locale );

		const t = locale.t;

		this.document = document;

		this.locale = locale;

		// Create key event & focus trackers
		this._createKeyAndFocusTrackers();

		// Submit button
		this.saveButtonView = this._createButton( t( 'Save' ), checkIcon, 'ck-button-save', null );
		this.saveButtonView.type = 'submit';

		// Equation input
		this.mathInputView = this._createMathInput();

		// Display button
		this.displayButtonView = this._createDisplayButton();

		this.keepOpenButtonView = this._createKeepOpenButton();

		// Cancel button
		this.cancelButtonView = this._createButton( t( 'Cancel' ), cancelIcon, 'ck-button-cancel', 'cancel' );

		this.previewEnabled = previewEnabled;

		let children;
		if ( this.previewEnabled ) {
			// Preview label
			this.previewLabel = new LabelView( locale );
			this.previewLabel.text = t( 'Equation preview' );

			// Math element
			this.mathView = new MathView( engine, lazyLoad, locale, previewUid, previewClassName, katexRenderOptions );
			this.mathView.bind( 'display' ).to( this.displayButtonView, 'isOn' );

			// Common commands label
			this.commandsLabel = new LabelView( locale );
			this.commandsLabel.text = t( 'Common commands' );


			children = [
				this.mathInputView,
				this.displayButtonView,
				this.keepOpenButtonView,
				this.previewLabel,
				this.mathView,
				this.commandsLabel,
				shortcuts(this.mathInputView, this.mathView),
			];
		} else {
			children = [
				this.mathInputView,
				this.displayButtonView,
				this.keepOpenButtonView
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

	render() {
		super.render();

		// Prevent default form submit event & trigger custom 'submit'
		submitHandler( {
			view: this
		} );

		// Register form elements to focusable elements
		const childViews = [
			this.mathInputView,
			this.displayButtonView,
			this.keepOpenButtonView,
			this.saveButtonView,
			this.cancelButtonView
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
		return this.mathInputView.inputView.element.textContent.trim();
	}

	set equation( equation ) {
		this.mathInputView.inputView.element.textContent = equation;
		if ( this.previewEnabled ) {
			this.mathView.value = equation;
		}
		this.mathInputView.inputView.select();
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
		const mathInput = new LabeledInputView( this.locale, MathInputView );
		const inputView = mathInput.inputView;
		inputView.template.attributes.id[0] = 'math-input-field';
		mathInput.infoText = t( 'Insert equation in TeX format.' );

		const onInput = () => {
			if ( inputView.element != null ) {
				let equationInput = inputView.element.textContent.trim();

				// If input has delimiters
				if ( hasDelimiters( equationInput )
					&& delimitersCounts(equationInput) % 2 === 0
					&& delimitersAreMatching(getMathFormsAndText(equationInput))
					&& delimitersAreAtBeginningAndEnd(getMathFormsAndText(equationInput))) {
					// Get equation without delimiters
					const params = extractDelimiters( equationInput );

					// Remove delimiters from input field
					inputView.element.textContent = params.equation;

					equationInput = params.equation;

					// update display button and preview
					this.displayButtonView.isOn = params.display;
				}
				if ( this.previewEnabled ) {
					// Update preview view
					this.mathView.value = equationInput;
				}

				this.saveButtonView.isEnabled = !!equationInput;
			}
		};

		inputView.on( 'render', onInput );
		inputView.on( 'input', onInput );
		mathInput.render();

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
				this.mathView.display = switchButton.isOn;
			}
		} );

		return switchButton;
	}
	_createKeepOpenButton() {
		const t = this.locale.t;

		const switchButton = new SwitchButtonView( this.locale );

		switchButton.set( {
			label: t( 'Fenster offen lassen ' ),
			withText: true,
		} );

		switchButton.extendTemplate( {
			attributes: {
				class: 'ck-button-display-toggle'
			}
		} );

		switchButton.on( 'execute', () => {
			// Toggle state
			switchButton.isOn = !switchButton.isOn;
			this.document.fire('mathKeepOpenChange', switchButton.isOn);
		} );

		return switchButton;
	}
}
