import { expect } from 'chai';
import { ClassicEditor, Essentials, Paragraph, Heading } from 'ckeditor5';
import Math from '../src/math.js';

describe( 'Math', () => {
	it( 'should be named', () => {
		expect( Math.pluginName ).to.equal( 'Math' );
	} );

	describe( 'init()', () => {
		let domElement: HTMLElement, editor: ClassicEditor;

		beforeEach( async () => {
			domElement = document.createElement( 'div' );
			document.body.appendChild( domElement );

			editor = await ClassicEditor.create( domElement, {
				plugins: [
					Paragraph,
					Heading,
					Essentials,
					Math
				],
				toolbar: [
					'mathButton'
				]
			} );
		} );

		afterEach( () => {
			domElement.remove();
			return editor.destroy();
		} );

		it( 'should load Math', () => {
			const myPlugin = editor.plugins.get( 'Math' );

			expect( myPlugin ).to.be.an.instanceof( Math );
		} );

		it( 'should add an icon to the toolbar', () => {
			expect( editor.ui.componentFactory.has( 'mathButton' ) ).to.equal( true );
		} );

		it( 'should add a text into the editor after clicking the icon', () => {
			const icon = editor.ui.componentFactory.create( 'mathButton' );

			expect( editor.getData() ).to.equal( '' );

			icon.fire( 'execute' );

			expect( editor.getData() ).to.equal( '<p>Hello CKEditor 5!</p>' );
		} );
	} );
} );
