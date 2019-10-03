export const defaultConfig = {
	engine: 'mathjax',
	outputType: 'script',
	forceOutputType: false,
	enablePreview: true
};

export function getSelectedMathModelWidget( selection ) {
	const selectedElement = selection.getSelectedElement();

	if ( selectedElement && selectedElement.is( 'mathtex' ) ) {
		return selectedElement;
	}

	return null;
}

export function renderEquation( equation, element, engine = 'katex', display = false, previewHack = false ) {
	if ( engine === 'mathjax' && typeof MathJax !== 'undefined' ) {
		if ( isMathJaxVersion3( MathJax.version ) ) {
			selectRenderMode( element, previewHack, el => {
				renderMathJax3( equation, el, display, () => {
					if ( previewHack ) {
						moveAndScaleElement( element, el );
					}
				} );
			} );
		} else {
			selectRenderMode( element, previewHack, el => {
				renderMathJax2( equation, el, display );
			} );
		}
	} else if ( engine === 'katex' && typeof katex !== 'undefined' ) {
		selectRenderMode( element, previewHack, el => {
			katex.render( equation, el, {
				throwOnError: false,
				displayMode: display
			} );
		} );
	} else if ( typeof engine === 'function' ) {
		engine( equation, element, display, previewHack );
	} else {
		element.innerHTML = equation;
		// eslint-disable-next-line
		console.warn( `math-tex-typesetting-missing: Missing the mathematical typesetting engine (${engine}) for tex.` );
	}
}

function selectRenderMode( element, preview, cb ) {
	if ( preview ) {
		createPreviewElement( element, prewviewEl => {
			cb( prewviewEl );
		} );
	} else {
		cb( element );
	}
}

function renderMathJax3( equation, element, display, after ) {
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
			after();
		} );
	}
}

function renderMathJax2( equation, element, display ) {
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

function createPreviewElement( element, render ) {
	const prewviewEl = getPreviewElement( element );
	render( prewviewEl );
	moveAndScaleElement( element, prewviewEl );
}

export function getPreviewElement( element ) {
	const elId = 'math-preview';
	let prewviewEl = document.getElementById( elId ); // eslint-disable-line
	if ( !prewviewEl ) {
		prewviewEl = document.createElement( 'div' ); // eslint-disable-line
		prewviewEl.setAttribute( 'id', elId );
		document.body.appendChild( prewviewEl ); // eslint-disable-line

		let ticking = false;

		const renderTransformation = () => {
			if ( !ticking ) {
				// eslint-disable-next-line
				window.requestAnimationFrame( () => {
					moveElement( element, prewviewEl );
					ticking = false;
				} );

				ticking = true;
			}
		};

		// Create scroll listener for following
		window.addEventListener( 'resize', renderTransformation ); // eslint-disable-line
		window.addEventListener( 'scroll', renderTransformation ); // eslint-disable-line
	}
	return prewviewEl;
}

function moveAndScaleElement( parent, element ) {
	moveElement( parent, element );

	// Scale parent element same as preview
	const domRect = element.getBoundingClientRect();
	// element.style.width = domRect.width + 'px';
	parent.style.height = domRect.height + 'px';
}

function moveElement( parent, element ) {
	const domRect = parent.getBoundingClientRect();
	const left = window.scrollX + domRect.left; // eslint-disable-line
	const top = window.scrollY + domRect.top; // eslint-disable-line
	element.style.position = 'absolute';
	element.style.left = left + 'px';
	element.style.top = top + 'px';
	element.style.zIndex = 'var(--ck-z-modal)';
	element.style.pointerEvents = 'none';
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
