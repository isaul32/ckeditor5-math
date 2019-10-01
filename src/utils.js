export const defaultConfig = {
	engine: 'mathjax',
	outputType: 'script',
	forceOutputType: false
};

export function getSelectedMathModelWidget( selection ) {
	const selectedElement = selection.getSelectedElement();

	if ( selectedElement && selectedElement.is( 'mathtex' ) ) {
		return selectedElement;
	}

	return null;
}

export function renderEquation( equation, element, engine = 'katex', display = false ) {
	if ( engine === 'mathjax' && typeof MathJax !== 'undefined' ) {
		if ( isMathJaxVersion3( MathJax.version ) ) {
			const options = MathJax.getMetricsFor( element, display );
			let promiseFunction = undefined;
			if ( typeof MathJax.tex2chtmlPromise !== 'undefined' ) {
				promiseFunction = MathJax.tex2chtmlPromise;
			} else if ( typeof MathJax.tex2svgPromise !== 'undefined' ) {
				promiseFunction = MathJax.tex2svgPromise;
			}

			if ( typeof promiseFunction !== 'undefined' ) {
				promiseFunction( equation, options ).then( node => {
					if ( element.firstChild ) {
						element.firstChild.replaceWith( node );
					} else {
						element.appendChild( node );
					}
					MathJax.startup.document.clear();
					MathJax.startup.document.updateDocument();
				} );
			}
		} else {
			// Fixme: MathJax typesetting cause occasionally math processing error without asynchronous call
			// eslint-disable-next-line
			setTimeout( () => {
				if ( display ) {
					element.innerHTML = '\\[' + equation + '\\]';
				} else {
					element.innerHTML = '\\(' + equation + '\\)';
				}
				MathJax.Hub.Queue( [ 'Typeset', MathJax.Hub, element ] ); // eslint-disable-line
			} );
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
		// eslint-disable-next-line
		console.warn( `math-tex-typesetting-missing: Missing the mathematical typesetting engine (${engine}) for tex.` );
	}
}

// Simple MathJax 3 version check
export function isMathJaxVersion3( version ) {
	return version && typeof version === 'string' && version.split( '.' ).length === 3 && version.split( '.' )[ 0 ] === '3';
}

// Check if equation has delimiters
export function hasDelimiters( text ) {
	return text.match( /^(\\\[.*?\\\]|\\\(.*?\\\))$/ );
}

// Extract delimiters and figure display mode for the model
export function extractDelimiters( equation ) {
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
