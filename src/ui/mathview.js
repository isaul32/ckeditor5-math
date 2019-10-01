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
			tag: 'iframe',
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
			// Fixme
			// eslint-disable-next-line
			setTimeout( () => {
				let docEl = ( el.contentWindow || el.contentDocument );
				if ( docEl.document ) {
					docEl = docEl.document;
				}

				const headEl = docEl.head;

				// Remove old styles
				while ( headEl.hasChildNodes() ) {
					headEl.removeChild( headEl.firstChild );
				}

				// Add all MathJax styles
				const styles = document.head.getElementsByTagName( 'style' ); // eslint-disable-line
				for ( const style of styles ) {
					const id = style.getAttribute( 'id' );
					if ( id && id.startsWith( 'MJX' ) ) {
						headEl.appendChild( style.cloneNode( true ) );
					}
				}

				const links = document.head.getElementsByTagName( 'link' ); // eslint-disable-line
				for ( const link of links ) {
					headEl.appendChild( link.cloneNode( true ) );
				}

				const bodyEl = docEl.body;
				bodyEl.setAttribute( 'style', 'margin-left: 0; margin-right: 0; user-select: none;' );

				renderEquation( this.value, bodyEl, this.engine, this.display );
			}, 100 );
		}
	}

	render() {
		super.render();
		this.updateMath();
	}
}
