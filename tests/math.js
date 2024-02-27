import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Mathematics from '../src/math';
import MathEditing from '../src/mathediting';
import MathUI from '../src/mathui';
import AutoMath from '../src/automath';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import global from '@ckeditor/ckeditor5-utils/src/dom/global';

describe( 'Math', () => {
	let editorElement, editor;

	beforeEach( () => {
		editorElement = global.document.createElement( 'div' );
		global.document.body.appendChild( editorElement );

		return ClassicEditor
			.create( editorElement, {
				plugins: [ Mathematics ]
			} )
			.then( newEditor => {
				editor = newEditor;
			} );
	} );

	afterEach( () => {
		editorElement.remove();

		return editor.destroy();
	} );

	it( 'should be loaded', () => {
		expect( editor.plugins.get( Mathematics ) ).to.instanceOf( Mathematics );
	} );

	it( 'should load MathEditing plugin', () => {
		expect( editor.plugins.get( MathEditing ) ).to.instanceOf( MathEditing );
	} );

	it( 'should load Widget plugin', () => {
		expect( editor.plugins.get( Widget ) ).to.instanceOf( Widget );
	} );

	it( 'should load MathUI plugin', () => {
		expect( editor.plugins.get( MathUI ) ).to.instanceOf( MathUI );
	} );

	it( 'should load AutoMath plugin', () => {
		expect( editor.plugins.get( AutoMath ) ).to.instanceOf( AutoMath );
	} );

	it( 'has proper name', () => {
		expect( Mathematics.pluginName ).to.equal( 'Math' );
	} );
} );
