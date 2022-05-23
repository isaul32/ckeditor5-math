import InputView from '@ckeditor/ckeditor5-ui/src/view';
import { Template } from '@ckeditor/ckeditor5-ui';

export default class MathLiveView extends InputView {
	constructor( locale, { options, attributes, style } ) {
		super( locale );
		this._options = options;
		const bind = Template.bind( this, this );
		this.set( 'value', '' );
		this.setTemplate( {
			tag: 'math-field',
			attributes: {
				...attributes,
				style
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
		this.element.setOptions( this._options );
	}
}
