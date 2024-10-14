import Mathematics from '../src/math.js';
import AutoMath from '../src/automath.js';
import {
	ClassicEditor, Clipboard, Paragraph, Undo, Typing, global,
	_getModelData as getData, _setModelData as setData
} from 'ckeditor5';
import { expect } from 'chai';
import type { SinonFakeTimers } from 'sinon';

describe( 'AutoMath - integration', () => {
	let editorElement: HTMLDivElement, editor: ClassicEditor;

	beforeEach( async () => {
		editorElement = global.document.createElement( 'div' );
		global.document.body.appendChild( editorElement );

		return ClassicEditor
			.create( editorElement, {
				plugins: [ Mathematics, AutoMath, Typing, Paragraph ],
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
			} );
	} );

	afterEach( () => {
		editorElement.remove();

		return editor.destroy();
	} );

	it( 'should load Clipboard plugin', () => {
		expect( editor.plugins.get( Clipboard ) ).to.instanceOf( Clipboard );
	} );

	it( 'should load Undo plugin', () => {
		expect( editor.plugins.get( Undo ) ).to.instanceOf( Undo );
	} );

	it( 'has proper name', () => {
		expect( AutoMath.pluginName ).to.equal( 'AutoMath' );
	} );

	describe( 'use fake timers', () => {
		let clock: SinonFakeTimers;

		beforeEach( () => {
			clock = sinon.useFakeTimers();
		} );

		afterEach( () => {
			clock.restore();
		} );

		it( 'replaces pasted text with mathtex element after 100ms', () => {
			setData( editor.model, '<paragraph>[]</paragraph>' );
			pasteHtml( editor, '\\[x^2\\]' );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>\\[x^2\\][]</paragraph>'
			);

			clock.tick( 100 );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>[<mathtex display="true" equation="x^2" type="script"></mathtex>]</paragraph>'
			);
		} );

		it( 'replaces pasted text with inline mathtex element after 100ms', () => {
			setData( editor.model, '<paragraph>[]</paragraph>' );
			pasteHtml( editor, '\\(x^2\\)' );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>\\(x^2\\)[]</paragraph>'
			);

			clock.tick( 100 );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>[<mathtex display="false" equation="x^2" type="script"></mathtex>]</paragraph>'
			);
		} );

		it( 'can undo auto-mathing', () => {
			setData( editor.model, '<paragraph>[]</paragraph>' );
			pasteHtml( editor, '\\[x^2\\]' );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>\\[x^2\\][]</paragraph>'
			);

			clock.tick( 100 );

			editor.commands.execute( 'undo' );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>\\[x^2\\][]</paragraph>'
			);
		} );

		it( 'works for not collapsed selection inside single element', () => {
			setData( editor.model, '<paragraph>[Foo]</paragraph>' );
			pasteHtml( editor, '\\[x^2\\]' );

			clock.tick( 100 );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>[<mathtex display="true" equation="x^2" type="script"></mathtex>]</paragraph>'
			);
		} );

		it( 'works for not collapsed selection over a few elements', () => {
			setData( editor.model, '<paragraph>Fo[o</paragraph><paragraph>Ba]r</paragraph>' );
			pasteHtml( editor, '\\[x^2\\]' );

			clock.tick( 100 );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>Fo[<mathtex display="true" equation="x^2" type="script"></mathtex>]r</paragraph>'
			);
		} );

		it( 'inserts mathtex in-place (collapsed selection)', () => {
			setData( editor.model, '<paragraph>Foo []Bar</paragraph>' );
			pasteHtml( editor, '\\[x^2\\]' );

			clock.tick( 100 );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>Foo ' +
				'[<mathtex display="true" equation="x^2" type="script"></mathtex>]' +
				'Bar</paragraph>'
			);
		} );

		it( 'inserts math in-place (non-collapsed selection)', () => {
			setData( editor.model, '<paragraph>Foo [Bar] Baz</paragraph>' );
			pasteHtml( editor, '\\[x^2\\]' );

			clock.tick( 100 );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>Foo ' +
				'[<mathtex display="true" equation="x^2" type="script"></mathtex>]' +
				' Baz</paragraph>'
			);
		} );

		it( 'does nothing if pasted two equation as text', () => {
			setData( editor.model, '<paragraph>[]</paragraph>' );
			pasteHtml( editor, '\\[x^2\\] \\[\\sqrt{x}2\\]' );

			clock.tick( 100 );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>\\[x^2\\] \\[\\sqrt{x}2\\][]</paragraph>'
			);
		} );
	} );

	function pasteHtml( editor: ClassicEditor, html: string ) {
		editor.editing.view.document.fire( 'paste', {
			dataTransfer: createDataTransfer( { 'text/html': html } ),
			preventDefault() {
				return undefined;
			}
		} );
	}

	function createDataTransfer( data: Record<string, string> ) {
		return {
			getData( type: string ) {
				return data[ type ];
			}
		};
	}
} );
