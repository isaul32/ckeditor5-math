/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* globals document, Event  */

import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor.js';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard.js';
import { setData as setModelData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model.js';

import MathUI from '../src/mathui';
import MainFormView from '../src/ui/mainformview';
import ContextualBalloon from '@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon.js';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview.js';
import View from '@ckeditor/ckeditor5-ui/src/view.js';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph.js';

import ClickObserver from '@ckeditor/ckeditor5-engine/src/view/observer/clickobserver.js';
import { expect } from 'chai';
import type { SinonSpy } from 'sinon';

describe( 'MathUI', () => {
	let editorElement: HTMLDivElement;
	let editor: ClassicEditor;
	let mathUIFeature: MathUI;
	let mathButton: ButtonView;
	let balloon: ContextualBalloon;
	let formView: MainFormView | null;

	beforeEach( async () => {
		editorElement = document.createElement( 'div' );
		document.body.appendChild( editorElement );

		return ClassicEditor
			.create( editorElement, {
				plugins: [ MathUI, Paragraph ],
				math: {
					engine: ( equation, element, display ) => {
						if ( display ) {
							element.innerHTML = '\\[' + equation + '\\]';
						} else {
							element.innerHTML = '\\(' + equation + '\\)';
						}
					}
				}
			} )
			.then( newEditor => {
				editor = newEditor;
				mathUIFeature = editor.plugins.get( MathUI );
				mathButton = editor.ui.componentFactory.create( 'math' ) as ButtonView;
				balloon = editor.plugins.get( ContextualBalloon );
				formView = mathUIFeature.formView;

				// There is no point to execute BalloonPanelView attachTo and pin methods so lets override it.
				sinon.stub( balloon.view, 'attachTo' ).returns( false );
				sinon.stub( balloon.view, 'pin' ).returns();

				formView?.render();
			} );
	} );

	afterEach( () => {
		editorElement.remove();

		return editor.destroy();
	} );

	describe( 'init', () => {
		it( 'should register click observer', () => {
			expect( editor.editing.view.getObserver( ClickObserver ) ).to.be.instanceOf( ClickObserver );
		} );

		it( 'should create #formView', () => {
			expect( formView ).to.be.instanceOf( MainFormView );
		} );

		describe( 'math toolbar button', () => {
			it( 'should be registered', () => {
				expect( mathButton ).to.be.instanceOf( ButtonView );
			} );

			it( 'should be toggleable button', () => {
				expect( mathButton.isToggleable ).to.be.true;
			} );

			it( 'should be bound to the math command', () => {
				const command = editor.commands.get( 'math' );

				if ( !command ) {
					throw new Error( 'Missing math command' );
				}

				command.isEnabled = true;
				command.value = '\\sqrt{x^2}';

				expect( mathButton.isEnabled ).to.be.true;

				command.isEnabled = false;
				command.value = undefined;

				expect( mathButton.isEnabled ).to.be.false;
			} );

			it( 'should call #_showUI upon #execute', () => {
				const spy = sinon.stub( mathUIFeature, '_showUI' ).returns( );

				mathButton.fire( 'execute' );
				sinon.assert.calledOnce( spy );
			} );
		} );
	} );

	describe( '_showUI()', () => {
		let balloonAddSpy: SinonSpy;

		beforeEach( () => {
			balloonAddSpy = sinon.spy( balloon, 'add' );
			editor.editing.view.document.isFocused = true;
		} );

		it( 'should not work if the math command is disabled', () => {
			setModelData( editor.model, '<paragraph>f[o]o</paragraph>' );

			const command = editor.commands.get( 'math' )!;

			command.isEnabled = false;

			mathUIFeature._showUI();

			expect( balloon.visibleView ).to.be.null;
		} );

		it( 'should not throw if the UI is already visible', () => {
			setModelData( editor.model, '<paragraph>f[o]o</paragraph>' );

			mathUIFeature._showUI();

			expect( () => {
				mathUIFeature._showUI();
			} ).to.not.throw();
		} );

		it( 'should add #mainFormView to the balloon and attach the balloon to the selection when text fragment is selected', () => {
			setModelData( editor.model, '<paragraph>f[o]o</paragraph>' );
			const selectedRange = editorElement.ownerDocument.getSelection()?.getRangeAt( 0 );

			mathUIFeature._showUI();

			expect( balloon.visibleView ).to.equal( formView );
			sinon.assert.calledWithExactly( balloonAddSpy, {
				view: formView,
				position: {
					target: selectedRange
				}
			} );
		} );

		it( 'should add #mainFormView to the balloon and attach the balloon to the selection when selection is collapsed', () => {
			setModelData( editor.model, '<paragraph>f[]oo</paragraph>' );
			const selectedRange = editorElement.ownerDocument.getSelection()?.getRangeAt( 0 );

			mathUIFeature._showUI();

			expect( balloon.visibleView ).to.equal( formView );
			sinon.assert.calledWithExactly( balloonAddSpy, {
				view: formView,
				position: {
					target: selectedRange
				}
			} );
		} );

		it( 'should disable #mainFormView element when math command is disabled', () => {
			setModelData( editor.model, '<paragraph>f[o]o</paragraph>' );

			mathUIFeature._showUI();

			const command = editor.commands.get( 'math' )!;

			command.isEnabled = true;

			expect( formView!.mathInputView.isReadOnly ).to.be.false;
			expect( formView!.saveButtonView.isEnabled ).to.be.true;
			expect( formView!.cancelButtonView.isEnabled ).to.be.true;

			command.isEnabled = false;

			expect( formView!.mathInputView.isReadOnly ).to.be.true;
			expect( formView!.saveButtonView.isEnabled ).to.be.false;
			expect( formView!.cancelButtonView.isEnabled ).to.be.true;
		} );

		describe( '_hideUI()', () => {
			beforeEach( () => {
				mathUIFeature._showUI();
			} );

			it( 'should remove the UI from the balloon', () => {
				expect( balloon.hasView( formView! ) ).to.be.true;

				mathUIFeature._hideUI();

				expect( balloon.hasView( formView! ) ).to.be.false;
			} );

			it( 'should focus the `editable` by default', () => {
				const spy = sinon.spy( editor.editing.view, 'focus' );

				mathUIFeature._hideUI();

				// First call is from _removeFormView.
				sinon.assert.calledTwice( spy );
			} );

			it( 'should focus the `editable` before before removing elements from the balloon', () => {
				const focusSpy = sinon.spy( editor.editing.view, 'focus' );
				const removeSpy = sinon.spy( balloon, 'remove' );

				mathUIFeature._hideUI();

				expect( focusSpy.calledBefore( removeSpy ) ).to.equal( true );
			} );

			it( 'should not throw an error when views are not in the `balloon`', () => {
				mathUIFeature._hideUI();

				expect( () => {
					mathUIFeature._hideUI();
				} ).to.not.throw();
			} );

			it( 'should clear ui#update listener from the ViewDocument', () => {
				const spy = sinon.spy();

				mathUIFeature.listenTo( editor.ui, 'update', spy );
				mathUIFeature._hideUI();
				editor.ui.fire( 'update' );

				sinon.assert.notCalled( spy );
			} );
		} );

		describe( 'keyboard support', () => {
			it( 'should show the UI on Ctrl+M keystroke', () => {
				const spy = sinon.stub( mathUIFeature, '_showUI' ).returns( );
				const command = editor.commands.get( 'math' )!;

				command.isEnabled = false;

				const keydata = {
					keyCode: keyCodes.m,
					ctrlKey: true,
					altKey: false,
					shiftKey: false,
					metaKey: false,
					preventDefault: sinon.spy(),
					stopPropagation: sinon.spy()
				};

				editor.keystrokes.press( keydata );

				sinon.assert.notCalled( spy );

				command.isEnabled = true;

				editor.keystrokes.press( keydata );
				sinon.assert.calledOnce( spy );
			} );

			it( 'should prevent default action on Ctrl+M keystroke', () => {
				const preventDefaultSpy = sinon.spy();
				const stopPropagationSpy = sinon.spy();

				const keyEvtData = {
					altKey: false,
					ctrlKey: true,
					shiftKey: false,
					metaKey: false,
					keyCode: keyCodes.m,
					preventDefault: preventDefaultSpy,
					stopPropagation: stopPropagationSpy
				};

				editor.keystrokes.press( keyEvtData );

				sinon.assert.calledOnce( preventDefaultSpy );
				sinon.assert.calledOnce( stopPropagationSpy );
			} );

			it( 'should make stack with math visible on Ctrl+M keystroke - no math', () => {
				const command = editor.commands.get( 'math' )!;

				command.isEnabled = true;

				balloon.add( {
					view: new View(),
					stackId: 'custom'
				} );

				const keyEvtData = {
					keyCode: keyCodes.m,
					ctrlKey: true,
					altKey: false,
					shiftKey: false,
					metaKey: false,
					preventDefault: sinon.spy(),
					stopPropagation: sinon.spy()
				};

				editor.keystrokes.press( keyEvtData );

				expect( balloon.visibleView ).to.equal( formView );
			} );

			it( 'should make stack with math visible on Ctrl+M keystroke - math', () => {
				setModelData( editor.model, '<paragraph><$text equation="x^2">f[]oo</$text></paragraph>' );

				const customView = new View();

				balloon.add( {
					view: customView,
					stackId: 'custom'
				} );

				expect( balloon.visibleView ).to.equal( customView );

				editor.keystrokes.press( {
					keyCode: keyCodes.m,
					ctrlKey: true,
					altKey: false,
					shiftKey: false,
					metaKey: false,
					// @ts-expect-error - preventDefault
					preventDefault: sinon.spy(),
					stopPropagation: sinon.spy()
				} );

				expect( balloon.visibleView ).to.equal( formView );
			} );

			it( 'should hide the UI after Esc key press (from editor) and not focus the editable', () => {
				const spy = sinon.spy( mathUIFeature, '_hideUI' );
				const keyEvtData = {
					altKey: false,
					ctrlKey: false,
					shiftKey: false,
					metaKey: false,
					keyCode: keyCodes.esc,
					preventDefault: sinon.spy(),
					stopPropagation: sinon.spy()
				};

				// Balloon is visible.
				mathUIFeature._showUI();
				editor.keystrokes.press( keyEvtData );

				sinon.assert.calledWithExactly( spy );
			} );

			it( 'should not hide the UI after Esc key press (from editor) when UI is open but is not visible', () => {
				const spy = sinon.spy( mathUIFeature, '_hideUI' );
				const keyEvtData = {
					altKey: false,
					shiftKey: false,
					ctrlKey: false,
					metaKey: false,
					keyCode: keyCodes.esc,
					preventDefault: sinon.spy(),
					stopPropagation: sinon.spy()
				};

				const viewMock = new View();
				sinon.stub( viewMock, 'render' );
				sinon.stub( viewMock, 'destroy' );

				mathUIFeature._showUI();

				// Some view precedes the math UI in the balloon.
				balloon.add( { view: viewMock } );
				editor.keystrokes.press( keyEvtData );

				sinon.assert.notCalled( spy );
			} );
		} );

		describe( 'mouse support', () => {
			it( 'should hide the UI and not focus editable upon clicking outside the UI', () => {
				const spy = sinon.spy( mathUIFeature, '_hideUI' );

				mathUIFeature._showUI();
				document.body.dispatchEvent( new Event( 'mousedown', { bubbles: true } ) );

				sinon.assert.calledWithExactly( spy );
			} );

			it( 'should not hide the UI upon clicking inside the the UI', () => {
				const spy = sinon.spy( mathUIFeature, '_hideUI' );

				mathUIFeature._showUI();
				balloon.view.element!.dispatchEvent( new Event( 'mousedown', { bubbles: true } ) );

				sinon.assert.notCalled( spy );
			} );
		} );

		describe( 'math form view', () => {
			it( 'should mark the editor UI as focused when the #formView is focused', () => {
				mathUIFeature._showUI();
				expect( balloon.visibleView ).to.equal( formView );

				editor.ui.focusTracker.isFocused = false;
				formView!.element!.dispatchEvent( new Event( 'focus' ) );

				expect( editor.ui.focusTracker.isFocused ).to.be.true;
			} );

			describe( 'binding', () => {
				beforeEach( () => {
					setModelData( editor.model, '<paragraph>f[o]o</paragraph>' );
				} );

				it( 'should bind mainFormView.mathInputView#value to math command value', () => {
					const command = editor.commands.get( 'math' );

					expect( formView!.mathInputView.value ).to.null;

					command!.value = 'x^2';
					expect( formView!.mathInputView.value ).to.equal( 'x^2' );
				} );

				it( 'should execute math command on mainFormView#submit event', () => {
					const executeSpy = sinon.spy( editor, 'execute' );

					formView!.mathInputView.value = 'x^2';
					expect( formView!.mathInputView.fieldView.element!.value ).to.equal( 'x^2' );

					formView!.mathInputView.fieldView.element!.value = 'x^2';
					formView!.fire( 'submit' );

					expect( executeSpy.calledOnce ).to.be.true;
					expect( executeSpy.calledWith( 'math', 'x^2' ) ).to.be.true;
				} );

				it( 'should hide the balloon on mainFormView#cancel if math command does not have a value', () => {
					mathUIFeature._showUI();
					formView!.fire( 'cancel' );

					expect( balloon.visibleView ).to.be.null;
				} );

				it( 'should hide the balloon after Esc key press if math command does not have a value', () => {
					const keyEvtData = {
						altKey: false,
						shiftKey: false,
						metaKey: false,
						ctrlKey: false,
						keyCode: keyCodes.esc,
						preventDefault: sinon.spy(),
						stopPropagation: sinon.spy()
					};

					mathUIFeature._showUI();

					formView!.keystrokes.press( keyEvtData );

					expect( balloon.visibleView ).to.be.null;
				} );

				it( 'should blur math input element before hiding the view', () => {
					mathUIFeature._showUI();

					const focusSpy = sinon.spy( formView!.saveButtonView, 'focus' );
					const removeSpy = sinon.spy( balloon, 'remove' );

					formView!.fire( 'cancel' );

					expect( focusSpy.calledBefore( removeSpy ) ).to.equal( true );
				} );
			} );
		} );
	} );
} );
