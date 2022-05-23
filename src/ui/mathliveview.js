import InputView from '@ckeditor/ckeditor5-ui/src/view';
import { Template } from '@ckeditor/ckeditor5-ui';

const attributeOptions = {
	fontsDirectory: 'fonts-directory'
};

export default class MathLiveView extends InputView {
	constructor( locale, options = {} ) {
		super( locale );
		this._elementOptions = this._getElementOptions( options );
		const bind = Template.bind( this, this );
		this.set( 'value', '' );
		this.setTemplate( {
			tag: 'math-field',
			attributes: {
				...this._getAttributeOptions( options )
			},
			on: {
				input: bind.to( event => {
					this.value = this.element.value;
					this.fire( 'input', event );
				} )
			}
		} );
		this.on( 'input', event => {
			if ( event.path.indexOf( this ) !== event.path.lastIndexOf( this ) ) {
				event.stop();
			}
		}, { priority: 'high' } );
		this.on( 'change:value', () => this.element.setValue( this.value, { suppressChangeNotifications: true } ) );
	}

	render() {
		super.render();
		this.element.setOptions( this._elementOptions );
	}

	_getAttributeOptions( options ) {
		return Object.fromEntries(
			Object.entries( options )
				.filter( ( { 0: key } ) => attributeOptions[ key ] !== undefined )
				.map( ( { 0: key, 1: value } ) => ( { 0: attributeOptions[ key ], 1: value } ) )
		);
	}

	_getElementOptions( options ) {
		return Object.fromEntries( Object.entries( options ).filter( ( { 0: key } ) => attributeOptions[ key ] === undefined ) );
	}
}
