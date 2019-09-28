export const EQUATION_REGEXP = /^(\\\[.*?\\\]|\\\(.*?\\\))$/;

export const defaultConfig = {
	engine: 'mathjax',
	outputType: 'script',
	forceOutputType: false
};

export function renderEquation( equation, element, engine = 'katex', display = false ) {
	if ( !element ) {
		return;
	}
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
			// Fixme: MathJax typesetting cause occasionally math processing error without timeout
			setTimeout( () => {
				if ( display ) {
					element.innerHTML = '\\[' + equation + '\\]';
				} else {
					element.innerHTML = '\\(' + equation + '\\)';
				}
				MathJax.Hub.Queue( [ 'Typeset', MathJax.Hub, element ] );
			}, 50);
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

// Simple MathJax 3 version check
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

// Remove delimiters and figure display mode for the model
export function removeDelimiters( equation ) {
	equation = equation.trim();

	// Remove delimiters (e.g. \( \) or \[ \])
	const hasInlineDelimiters = equation.includes( '\\(' ) && equation.includes( '\\)' );
	const hasDisplayDelimiters = equation.includes( '\\[' ) && equation.includes( '\\]' );
	if ( hasInlineDelimiters || hasDisplayDelimiters ) {
		equation = equation.substring( 2, equation.length - 2 ).trim();
	}

	return {
		equation,
		display: hasDisplayDelimiters
	};
}
