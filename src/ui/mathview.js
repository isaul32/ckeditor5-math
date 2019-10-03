import View from '@ckeditor/ckeditor5-ui/src/view';

import { renderEquation } from '../utils';

export default class MathView extends View {
	constructor( engine, locale ) {
		super( locale );

		this.engine = engine;

		this.set( 'value', '' );
		this.set( 'display', false );

		this.on( 'change', () => {
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
		const el = this.element;
		if ( el ) {
			renderEquation( this.value, el, this.engine, this.display, true );
		}
	}

	render() {
		super.render();
		this.updateMath();
	}
}
