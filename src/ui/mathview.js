import View from '@ckeditor/ckeditor5-ui/src/view';
import { renderEquation } from '../utils';

export default class MathView extends View {
	constructor( engine, locale ) {
		super( locale );

		this.engine = engine;

		this.set( 'value', '' );

		this.on( 'change:value', () => {
			this.updateMath();
		} );

		this.setTemplate( {
			tag: 'div',
			attributes: {
				class: [
					'ck',
					'ck-math-preview'
				],
			}
		} );
	}

	updateMath() {
		renderEquation( this.value, this.element, this.engine );
	}

	render() {
		super.render();
		this.updateMath();
	}
}
