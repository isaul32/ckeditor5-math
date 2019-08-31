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
	}
	else if ( engine === 'katex' && typeof katex !== 'undefined' ) {
		/* eslint-disable */
        katex.render( equation, element, {
			throwOnError: false,
			displayMode: display
        } );
        /* eslint-enable */
	} else {
		element.innerHTML = equation;
		console.warn( 'math-tex-typesetting-missing: Missing the mathematical typesetting engine for tex.' );
	}
}

export function getSelectedMathModelWidget( selection ) {
	const selectedElement = selection.getSelectedElement();

	if ( selectedElement && selectedElement.is( 'mathtex' ) ) {
		return selectedElement;
	}

	return null;
}
