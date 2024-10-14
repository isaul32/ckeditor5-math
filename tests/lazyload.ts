import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import MathUI from '../src/mathui';
import type { EditorConfig } from '@ckeditor/ckeditor5-core/src/editor/editorconfig';
import { expect } from 'chai';

describe( 'Lazy load', () => {
	let editorElement: HTMLDivElement;
	let editor: ClassicEditor;
	let lazyLoadInvoked: boolean;
	let mathUIFeature: MathUI;

	function buildEditor( config: EditorConfig ) {
		return ClassicEditor
			.create( editorElement, {
				...config,
				plugins: [ MathUI ]
			} )
			.then( newEditor => {
				editor = newEditor;
				mathUIFeature = editor.plugins.get( MathUI );
			} );
	}

	beforeEach( () => {
		editorElement = document.createElement( 'div' );
		document.body.appendChild( editorElement );

		lazyLoadInvoked = false;
	} );

	afterEach( () => {
		editorElement.remove();
		return editor.destroy();
	} );

	it( 'initializes lazy load for KaTeX', async () => {
		await buildEditor( {
			math: {
				engine: 'katex',
				lazyLoad: async () => {
					lazyLoadInvoked = true;
				}
			}
		} );

		mathUIFeature._showUI();
		expect( lazyLoadInvoked ).to.be.true;
	} );
} );
