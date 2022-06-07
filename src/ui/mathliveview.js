import InputView from '@ckeditor/ckeditor5-ui/src/view';

export default class MathLiveView extends InputView {
	constructor( locale, { options, attributes } ) {
		super( locale );
		this._options = options;
		const bind = this.bindTemplate;
		this.set( 'value', '' );
		this.setTemplate( {
			tag: 'math-field',
			attributes,
			on: {
				input: [
					bind.to( () => ( this.value = this.element.getValue( 'latex-expanded' ) ) ),
					bind.to( 'input' )
				]
			}
		} );
		this.on( 'input', event => {
			// This handler should stop events loop
			if ( event.path.indexOf( this ) !== event.path.lastIndexOf( this ) ) {
				event.stop();
			}
		}, { priority: 'high' } );
		this.on( 'change:value', () => {
			if ( this.value === this.element.getValue( 'latex-expanded' ) ) {
				// Don't update mathlive again - probably text was changed by mathlive
				return;
			}

			this.element.setValue( this.value, { format: 'latex', suppressChangeNotifications: true } );
		} );
	}

	render() {
		super.render();
		// this.element is a mathlive's mathelement instance at this point
		// https://cortexjs.io/mathlive/guides/interacting/
		this.element.setOptions( this._options );
	}
}
