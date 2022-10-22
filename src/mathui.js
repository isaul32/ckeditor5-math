import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ClickObserver from '@ckeditor/ckeditor5-engine/src/view/observer/clickobserver';
import ContextualBalloon from '@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon';
import clickOutsideHandler from '@ckeditor/ckeditor5-ui/src/bindings/clickoutsidehandler';
import uid from '@ckeditor/ckeditor5-utils/src/uid';
import global from '@ckeditor/ckeditor5-utils/src/dom/global';
import { getBalloonPositionData } from './utils';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import MainFormView from './ui/mainformview';

// Need math commands from there
import MathEditing from './mathediting';

import mathIcon from '../assets/math.svg';

const mathKeystroke = 'Ctrl+4';

export default class MathUI extends Plugin {
	static get requires() {
		return [ ContextualBalloon, MathEditing ];
	}

	static get pluginName() {
		return 'MathUI';
	}

	init() {
		const editor = this.editor;
		editor.editing.view.addObserver( ClickObserver );

		this._previewUid = `math-preview-${ uid() }`;

		this.formView = this._createFormView();

		this._balloon = editor.plugins.get( ContextualBalloon );

		this._createToolbarMathButton();

		this._enableUserBalloonInteractions();
	}

	destroy() {
		super.destroy();

		this.formView.destroy();

		// Destroy preview element
		const previewEl = global.document.getElementById( this._previewUid );
		if ( previewEl ) {
			previewEl.parentNode.removeChild( previewEl );
		}
	}

	_showUI() {
		const editor = this.editor;
		const mathCommand = editor.commands.get( 'math' );

		if ( !mathCommand.isEnabled ) {
			return;
		}

		//solves this bug:  clicking on a formula with display true and then on
		// 					another with display false will result in not changing display mode button when mathKeepOpen is true
		//this checks whether a formula was clicked or not, if yes the last ui is hidden (even it mathKeepOpen)
		//so the new ui is correcly put in the right place with the right options
		if (editor.editing.view.document.selection.getSelectedElement()) {
			this._hideUI();
		}

		this._addFormView();

		this._balloon.showStack( 'main' );
	}

	_createFormView() {
		const editor = this.editor;
		const mathCommand = editor.commands.get( 'math' );

		const mathConfig = editor.config.get( 'math' );

		const formView = new MainFormView(
			editor.model.document,
			editor.locale,
			mathConfig.engine,
			mathConfig.lazyLoad,
			mathConfig.enablePreview,
			this._previewUid,
			mathConfig.previewClassName,
			mathConfig.popupClassName,
		);

		formView.mathInputView.bind( 'textContent' ).to( mathCommand, 'value' );
		formView.displayButtonView.bind( 'isOn' ).to( mathCommand, 'display' );

		// Form elements should be read-only when corresponding commands are disabled.
		formView.mathInputView.bind( 'isReadOnly' ).to( mathCommand, 'isEnabled', value => !value ); //TODO next
		formView.saveButtonView.bind( 'isEnabled' ).to( mathCommand );
		formView.displayButtonView.bind( 'isEnabled' ).to( mathCommand );

		formView.keepOpenButtonView.bind( 'isOn' ).to( mathConfig, 'keepOpen' );
		formView.keepOpenButtonView.bind( 'isEnabled' ).to( mathCommand );
		mathCommand.bind( 'keepOpen' ).to( formView.keepOpenButtonView, 'isOn' );

		// Listen to submit button click
		this.listenTo( formView, 'submit', () => {
			editor.execute( 'math', formView.equation, formView.displayButtonView.isOn,
				mathConfig.outputType, mathConfig.forceOutputType, mathCommand.keepOpen );
			this._closeFormView();
		} );

		// Listen to enter button click
		formView.keystrokes.set( 'enter', ( data, cancel ) => {
			if (formView.focusTracker.focusedElement.classList.contains('ck-labeled-input')) { //enter in input (which is now div) submits formula
				editor.execute('math', formView.equation, formView.displayButtonView.isOn,
					mathConfig.outputType, mathConfig.forceOutputType, mathCommand.keepOpen);
				this._closeFormView();
				cancel();
			}
		} );

		// Listen to cancel button click
		this.listenTo( formView, 'cancel', () => {
			this._closeFormView();
		} );

		// Close plugin ui, if esc is pressed (while ui is focused)
		formView.keystrokes.set( 'esc', ( data, cancel ) => {
			this._closeFormView();
			cancel();
		} );

		return formView;
	}

	_addFormView() {
		if ( this._isFormInPanel ) {
			return;
		}

		const editor = this.editor;
		const mathCommand = editor.commands.get( 'math' );

		this._balloon.add( {
			view: this.formView,
			position: getBalloonPositionData( editor )
		} );

		if ( this._balloon.visibleView === this.formView ) {
			this.formView.mathInputView.select();
		}

		// Show preview element
		const previewEl = global.document.getElementById( this._previewUid );
		if ( previewEl && this.formView.previewEnabled ) {
			// Force refresh preview
			this.formView.mathView.updateMath();
		}

		this.formView.equation = mathCommand.value || '';
		this.formView.displayButtonView.isOn = mathCommand.display || false;
	}

	_hideUI() {
		if ( !this._isFormInPanel ) {
			return;
		}

		const editor = this.editor;

		this.stopListening( editor.ui, 'update' );
		this.stopListening( this._balloon, 'change:visibleView' );

		editor.editing.view.focus();

		// Remove form first because it's on top of the stack.
		this._removeFormView();
	}

	_closeFormView() {
		const mathCommand = this.editor.commands.get( 'math' );
		if ( mathCommand.value !== undefined ) {
			mathCommand.resetMathCommand();
			this._removeFormView();
		} else {
			this._hideUI();
		}
	}

	_removeFormView() {
		if ( this._isFormInPanel ) {
			//this.formView.saveButtonView.focus();

			this._balloon.remove( this.formView );

			// Hide preview element
			const previewEl = global.document.getElementById( this._previewUid );
			if ( previewEl ) {
				previewEl.style.visibility = 'hidden';
			}

			this.editor.editing.view.focus();
		}
	}

	_createToolbarMathButton() {
		const editor = this.editor;
		const mathCommand = editor.commands.get( 'math' );
		const t = editor.t;

		// Handle the `Ctrl+M` keystroke and show the panel.
		editor.keystrokes.set( mathKeystroke, ( keyEvtData, cancel ) => {
			// Prevent focusing the search bar in FF and opening new tab in Edge. #153, #154.
			cancel();
			if ( mathCommand.isEnabled ) {
				this._showUI();
			}
		} );

		editor.editing.view.document.on( 'keydown', ( evt, data ) => {
			if ( data.keyCode === 51 && data.shiftKey ) {
				data.stopPropagation();
				data.preventDefault();
				evt.stop();
				if ( mathCommand.isEnabled ) {
					this._showUI();
				}
			}
		}, { priority: 'highest' } );

		this.editor.ui.componentFactory.add( 'math', locale => {
			const button = new ButtonView( locale );

			button.isEnabled = true;
			button.label = t( 'Insert math' );
			button.icon = mathIcon;
			button.keystroke = mathKeystroke;
			button.tooltip = true;
			button.isToggleable = true;

			button.bind( 'isEnabled' ).to( mathCommand, 'isEnabled' );

			this.listenTo( button, 'execute', () => this._showUI() );

			return button;
		} );
	}

	_enableUserBalloonInteractions() {
		const editor = this.editor;
		const viewDocument = this.editor.editing.view.document;
		this.listenTo( viewDocument, 'click', () => {
			const mathCommand = editor.commands.get( 'math' );
			if ( mathCommand.value ) { //if you click on a formula, you want to open the view
				if ( mathCommand.isEnabled && (mathCommand.currentlyRealMathSelection || mathCommand.viewHasBeenOpened)) {
					this._showUI();
					mathCommand.viewHasBeenOpened = true;
				}
			} else { //if you click somewhere else (and keepOpen is false, otherwise value would not change), forget previously saved fomula
				mathCommand.resetMathCommand();
			}
		} );

		// Close the panel on the Esc key press when the editable has focus and the balloon is visible.
		editor.keystrokes.set( 'Esc', ( data, cancel ) => {
			if ( this._isUIVisible ) {
				this._hideUI();
				cancel();
			}
		} );

		// Close on click outside of balloon panel element.
		clickOutsideHandler( {
			emitter: this.formView,
			activator: () => this._isFormInPanel,
			contextElements: [ this._balloon.view.element ],
			callback: () => {
				const mathCommand = editor.commands.get( 'math' );
				if (!mathCommand.keepOpen) {
					this._hideUI();
				}
			}
		} );
	}

	get _isUIVisible() {
		const visibleView = this._balloon.visibleView;

		return visibleView == this.formView;
	}

	get _isFormInPanel() {
		return this._balloon.hasView( this.formView );
	}
}
