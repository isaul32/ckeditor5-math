import InputView from '@ckeditor/ckeditor5-ui/src/view';
import 'mathlive';
import { Template } from '@ckeditor/ckeditor5-ui';

export default class MathLiveView extends InputView {
	constructor( locale ) {
		super( locale );
		const bind = Template.bind( this, this );
		this.set( 'value', '' );
		this.setTemplate( {
			tag: 'math-field',
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
		this.element.setOptions( {
			virtualKeyboardMode: 'manual'
		} );
	}
}
