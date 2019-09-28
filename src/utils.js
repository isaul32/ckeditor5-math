export function renderEquation( equation, element, engine = 'katex', display = false ) {
	/* eslint-disable */
	if ( engine === 'mathjax' && typeof MathJax !== 'undefined' ) {
		const version = MathJax.version;
		// If major version is 3
		if ( isMathJaxVersion3( version ) ) {
			const options = MathJax.getMetricsFor( element );

			MathJax.texReset();
			MathJax.tex2chtmlPromise( equation, options ).then( node => {
				if ( element.firstChild ) {
					element.firstChild.replaceWith( node );
				} {
					element.appendChild( node );
				}
				MathJax.startup.document.clear();
				MathJax.startup.document.updateDocument();
			  } );
		} else {
			if ( display ) {
				element.innerHTML = '\\[' + equation + '\\]';
			} else {
				element.innerHTML = '\\(' + equation + '\\)';
			}
			MathJax.Hub.Queue( [ 'Typeset', MathJax.Hub, element ] );
		}
	} else if ( engine === 'katex' && typeof katex !== 'undefined' ) {
        katex.render( equation, element, {
			throwOnError: false,
			displayMode: display
        } );
	} else if ( typeof engine === 'function' ) {
		engine( equation, element, display );
	} else {
		element.innerHTML = equation;
		console.warn( `math-tex-typesetting-missing: Missing the mathematical typesetting engine (${engine}) for tex.` );
	}
	/* eslint-enable */
}

export function isMathJaxVersion3( version ) {
	return version && typeof version === 'string' && version.split( '.' ).length === 3 && version.split( '.' )[ 0 ] === '3';
}

export function getSelectedMathModelWidget( selection ) {
	const selectedElement = selection.getSelectedElement();

	if ( selectedElement && selectedElement.is( 'mathtex' ) ) {
		return selectedElement;
	}

	return null;
}

export const defaultConfig = {
	engine: 'mathjax',
	outputType: 'script',
	forceOutputType: false
};
