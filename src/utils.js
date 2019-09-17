export function renderEquation( equation, element, engine = 'katex', display = false ) {
	if ( engine === 'mathjax' && typeof katex !== 'mathjax' ) {
		if (display) {
			element.innerHTML = '\\[' + equation + '\\]';
		} else {
			element.innerHTML = '\\(' + equation + '\\)';
		}
		/* eslint-disable */
		MathJax.Hub.Queue( [ 'Typeset', MathJax.Hub, element ] );
		/* eslint-enable */
	} else if ( engine === 'katex' && typeof katex !== 'undefined' ) {
		/* eslint-disable */
        katex.render( equation, element, {
			throwOnError: false,
			displayMode: display
        } );
        /* eslint-enable */
	} else if ( typeof engine === 'function' ) {
		engine(equation, element, display);
	} else {
		element.innerHTML = equation;
		console.warn( `math-tex-typesetting-missing: Missing the mathematical typesetting engine (${engine}) for tex.` );
	}
}

export function getSelectedMathModelWidget( selection ) {
	const selectedElement = selection.getSelectedElement();

	if ( selectedElement && selectedElement.is( 'mathtex' ) ) {
		return selectedElement;
	}

	return null;
}


export const defaultConfig = {
	/*
	engine: (equation, element, display) => {
	console.log(equation, element, display);
	},
	*/
	engine: 'mathjax',
	outputType: 'script',
	forceOutputType: false
}