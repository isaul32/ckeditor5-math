import Mathematics from '../src/math';
import AutoMath from '../src/automath';
import ClassicTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/classictesteditor';
import Clipboard from '@ckeditor/ckeditor5-clipboard/src/clipboard';
import Undo from '@ckeditor/ckeditor5-undo/src/undo';
import Typing from '@ckeditor/ckeditor5-typing/src/typing';
import global from '@ckeditor/ckeditor5-utils/src/dom/global';
import { getData, setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';

describe( 'AutoMath - integration', () => {
	let editorElement, editor;

	beforeEach( () => {
		editorElement = global.document.createElement( 'div' );
		global.document.body.appendChild( editorElement );

		return ClassicTestEditor
			.create( editorElement, {
				plugins: [ Mathematics, AutoMath, Typing ]
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
		let clock;

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
				'[<mathtex equation="x^2" display="true"></mathtex>]'
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
				'[<mathtex equation="x^2" display="false"></mathtex>]'
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
				'[<mathtex equation="x^2"" display="true"></mathtex>]'
			);
		} );

		it( 'works for not collapsed selection over a few elements', () => {
			setData( editor.model, '<paragraph>Fo[o</paragraph><paragraph>Ba]r</paragraph>' );
			pasteHtml( editor, '\\[x^2\\]' );

			clock.tick( 100 );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>Fo</paragraph>[<mathtex equation="x^2" display="true"></mathtex>]<paragraph>r</paragraph>'
			);
		} );

		it( 'inserts mathtex in-place (collapsed selection)', () => {
			setData( editor.model, '<paragraph>Foo []Bar</paragraph>' );
			pasteHtml( editor, '\\[x^2\\]' );

			clock.tick( 100 );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>Foo </paragraph>' +
				'[<mathtex equation="x^2" display="true"></mathtex>]' +
				'<paragraph>Bar</paragraph>'
			);
		} );

		it( 'inserts media in-place (non-collapsed selection)', () => {
			setData( editor.model, '<paragraph>Foo [Bar] Baz</paragraph>' );
			pasteHtml( editor, '\\[x^2\\]' );

			clock.tick( 100 );

			expect( getData( editor.model ) ).to.equal(
				'<paragraph>Foo </paragraph>' +
				'[<mathtex equation="x^2" display="true"></mathtex>]' +
				'<paragraph> Baz</paragraph>'
			);
		} );

		it( 'does nothing if pasted two equation as text', () => {
			setData( editor.model, '<paragraph>[]</paragraph>' );
			pasteHtml( editor, '\\[x^2\\] \\[\\sqrt{x}2\\]' );

			clock.tick( 100 );

			expect( getData( editor.model ) ).to.equal(
				'\\[x^2\\] \\[\\sqrt{x}2\\]'
			);
		} );
	} );

	function pasteHtml( editor, html ) {
		editor.editing.view.document.fire( 'paste', {
			dataTransfer: createDataTransfer( { 'text/html': html } ),
			preventDefault() {
			}
		} );
	}

	function createDataTransfer( data ) {
		return {
			getData( type ) {
				return data[ type ];
			}
		};
	}
} );
