import MathEditing from './mathediting';
import MainFormView from './ui/mainformview';
import mathIcon from '../theme/icons/math.svg';
import { Plugin } from 'ckeditor5/src/core';
import { ClickObserver } from 'ckeditor5/src/engine';
import {
	ButtonView,
	ContextualBalloon,
	clickOutsideHandler
} from 'ckeditor5/src/ui';
import { CKEditorError, global, uid } from 'ckeditor5/src/utils';
import { getBalloonPositionData } from './utils';
import MathCommand from './mathcommand';

const mathKeystroke = 'Ctrl+M';

export default class MathUI extends Plugin {
	public static get requires() {
		return [ ContextualBalloon, MathEditing ] as const;
	}

	public static get pluginName() {
		return 'MathUI' as const;
	}

	private _previewUid = `math-preview-${ uid() }`;
	private _balloon: ContextualBalloon = this.editor.plugins.get( ContextualBalloon );
	public formView: MainFormView | null = null;

	public init(): void {
		const editor = this.editor;
		editor.editing.view.addObserver( ClickObserver );

		this._createToolbarMathButton();

		this.formView = this._createFormView();

		this._enableUserBalloonInteractions();
	}

	public destroy(): void {
		super.destroy();

		this.formView?.destroy();

		// Destroy preview element
		const previewEl = global.document.getElementById( this._previewUid );
		if ( previewEl ) {
			previewEl.parentNode?.removeChild( previewEl );
		}
	}

	public _showUI(): void {
		const editor = this.editor;
		const mathCommand = editor.commands.get( 'math' );

		if ( !mathCommand?.isEnabled ) {
			return;
		}

		this._addFormView();

		this._balloon.showStack( 'main' );
	}

	private _createFormView() {
		const editor = this.editor;
		const mathCommand = editor.commands.get( 'math' );
		if ( !( mathCommand instanceof MathCommand ) ) {
			/**
			 * Missing Math command
			 * @error math-command
			 */
			throw new CKEditorError( 'math-command' );
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const mathConfig = editor.config.get( 'math' )!;

		const formView = new MainFormView(
			editor.locale,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			mathConfig.engine!,
			mathConfig.lazyLoad,
			mathConfig.enablePreview,
			this._previewUid,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			mathConfig.previewClassName!,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			mathConfig.popupClassName!,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			mathConfig.katexRenderOptions!
		);

		formView.mathInputView.bind( 'value' ).to( mathCommand, 'value' );
		formView.displayButtonView.bind( 'isOn' ).to( mathCommand, 'display' );

		// Form elements should be read-only when corresponding commands are disabled.
		formView.mathInputView.bind( 'isReadOnly' ).to( mathCommand, 'isEnabled', value => !value );
		formView.saveButtonView.bind( 'isEnabled' ).to( mathCommand );
		formView.displayButtonView.bind( 'isEnabled' ).to( mathCommand );

		// Listen to submit button click
		this.listenTo( formView, 'submit', () => {
			editor.execute( 'math', formView.equation, formView.displayButtonView.isOn, mathConfig.outputType, mathConfig.forceOutputType );
			this._closeFormView();
		} );

		// Listen to cancel button click
		this.listenTo( formView, 'cancel', () => {
			this._closeFormView();
		} );

		// Close plugin ui, if esc is pressed (while ui is focused)
		formView.keystrokes.set( 'esc', ( _data, cancel ) => {
			this._closeFormView();
			cancel();
		} );

		return formView;
	}

	private _addFormView() {
		if ( this._isFormInPanel ) {
			return;
		}

		const editor = this.editor;
		const mathCommand = editor.commands.get( 'math' );
		if ( !( mathCommand instanceof MathCommand ) ) {
			/**
			* Math command not found
			* @error plugin-load
					*/
			throw new CKEditorError( 'plugin-load', { pluginName: 'math' } );
		}

		if ( this.formView == null ) {
			return;
		}

		this._balloon.add( {
			view: this.formView,
			position: getBalloonPositionData( editor )
		} );

		if ( this._balloon.visibleView === this.formView ) {
			this.formView.mathInputView.fieldView.element?.select();
		}

		// Show preview element
		const previewEl = global.document.getElementById( this._previewUid );
		if ( previewEl && this.formView.previewEnabled ) {
			// Force refresh preview
			this.formView.mathView?.updateMath();
		}

		this.formView.equation = mathCommand.value ?? '';
		this.formView.displayButtonView.isOn = mathCommand.display || false;
	}

	private _hideUI() {
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

	private _closeFormView() {
		const mathCommand = this.editor.commands.get( 'math' );
		if ( mathCommand?.value != null ) {
			this._removeFormView();
		} else {
			this._hideUI();
		}
	}

	private _removeFormView() {
		if ( this._isFormInPanel && this.formView ) {
			this.formView.saveButtonView.focus();

			this._balloon.remove( this.formView );

			// Hide preview element
			const previewEl = global.document.getElementById( this._previewUid );
			if ( previewEl ) {
				previewEl.style.visibility = 'hidden';
			}

			this.editor.editing.view.focus();
		}
	}

	private _createToolbarMathButton() {
		const editor = this.editor;
		const mathCommand = editor.commands.get( 'math' );
		if ( !mathCommand ) {
			/**
			* Math command not found
			* @error plugin-load
					*/
			throw new CKEditorError( 'plugin-load', { pluginName: 'math' } );
		}
		const t = editor.t;

		// Handle the `Ctrl+M` keystroke and show the panel.
		editor.keystrokes.set( mathKeystroke, ( _keyEvtData, cancel ) => {
			// Prevent focusing the search bar in FF and opening new tab in Edge. #153, #154.
			cancel();

			if ( mathCommand.isEnabled ) {
				this._showUI();
			}
		} );

		this.editor.ui.componentFactory.add( 'math', locale => {
			const button = new ButtonView( locale );

			button.isEnabled = true;
			button.label = t( 'Insert math' );
			button.icon = mathIcon;
			button.keystroke = mathKeystroke;
			button.tooltip = true;
			button.isToggleable = true;

			button.bind( 'isEnabled' ).to( mathCommand, 'isEnabled' );

			this.listenTo( button, 'execute', () => {
				this._showUI();
			} );

			return button;
		} );
	}

	private _enableUserBalloonInteractions() {
		const editor = this.editor;
		const viewDocument = this.editor.editing.view.document;
		this.listenTo( viewDocument, 'click', () => {
			const mathCommand = editor.commands.get( 'math' );
			if ( mathCommand?.isEnabled && mathCommand.value ) {
				this._showUI();
			}
		} );

		// Close the panel on the Esc key press when the editable has focus and the balloon is visible.
		editor.keystrokes.set( 'Esc', ( _data, cancel ) => {
			if ( this._isUIVisible ) {
				this._hideUI();
				cancel();
			}
		} );

		// Close on click outside of balloon panel element.
		if ( this.formView ) {
			clickOutsideHandler( {
				emitter: this.formView,
				activator: () => !!this._isFormInPanel,
				contextElements: this._balloon.view.element ? [ this._balloon.view.element ] : [],
				callback: () => { this._hideUI(); }
			} );
		} else {
			throw new Error( 'missing form view' );
		}
	}

	private get _isUIVisible() {
		const visibleView = this._balloon.visibleView;

		return visibleView == this.formView;
	}

	private get _isFormInPanel() {
		return this.formView && this._balloon.hasView( this.formView );
	}
}
