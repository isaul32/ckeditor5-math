import { BalloonPanelView } from 'ckeditor5/src/ui';
import { global } from 'ckeditor5/src/utils';

export function getSelectedMathModelWidget( selection ) {
	const selectedElement = selection.getSelectedElement();

	if ( selectedElement && ( selectedElement.is( 'element', 'mathtex-inline' ) || selectedElement.is( 'element', 'mathtex-display' ) ) ) {
		return selectedElement;
	}

	return null;
}

// Simple MathJax 3 version check
export function isMathJaxVersion3( version ) {
	return version && typeof version === 'string' && version.split( '.' ).length === 3 && version.split( '.' )[ 0 ] === '3';
}

// Check if equation has delimiters.
export function hasDelimiters( text ) {
	return text.match( /^(\\\[.*?\\\]|\\\(.*?\\\))$/ );
}

// Find delimiters count
export function delimitersCounts( text ) {
	return text.match( /(\\\[|\\\]|\\\(|\\\))/g ).length;
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

export async function renderEquation(
	equation, element, engine = 'katex', lazyLoad, display = false, preview = false, previewUid, previewClassName = [],
	katexRenderOptions = {}
) {
	if ( engine === 'mathjax' && typeof MathJax !== 'undefined' ) {
		if ( isMathJaxVersion3( MathJax.version ) ) {
			selectRenderMode( element, preview, previewUid, previewClassName, el => {
				renderMathJax3( equation, el, display, () => {
					if ( preview ) {
						moveAndScaleElement( element, el );
						el.style.visibility = 'visible';
					}
				} );
			} );
		} else {
			selectRenderMode( element, preview, previewUid, previewClassName, el => {
				// Fixme: MathJax typesetting cause occasionally math processing error without asynchronous call
				global.window.setTimeout( () => {
					renderMathJax2( equation, el, display );

					// Move and scale after rendering
					if ( preview ) {
						// eslint-disable-next-line
						MathJax.Hub.Queue( () => {
							moveAndScaleElement( element, el );
							el.style.visibility = 'visible';
						} );
					}
				} );
			} );
		}
	} else if ( engine === 'katex' && typeof katex !== 'undefined' ) {
		selectRenderMode( element, preview, previewUid, previewClassName, el => {
			katex.render( equation, el, {
				throwOnError: false,
				displayMode: display,
				...katexRenderOptions
			} );
			if ( preview ) {
				moveAndScaleElement( element, el );
				el.style.visibility = 'visible';
			}
		} );
	} else if ( typeof engine === 'function' ) {
		engine( equation, element, display );
	} else {
		if ( typeof lazyLoad !== 'undefined' ) {
			try {
				if ( !global.window.CKEDITOR_MATH_LAZY_LOAD ) {
					global.window.CKEDITOR_MATH_LAZY_LOAD = lazyLoad();
				}
				element.innerHTML = equation;
				await global.window.CKEDITOR_MATH_LAZY_LOAD;
				renderEquation( equation, element, engine, undefined, display, preview, previewUid, previewClassName, katexRenderOptions );
			}
			catch ( err ) {
				element.innerHTML = equation;
				console.error( `math-tex-typesetting-lazy-load-failed: Lazy load failed: ${ err }` );
			}
		} else {
			element.innerHTML = equation;
			console.warn( `math-tex-typesetting-missing: Missing the mathematical typesetting engine (${ engine }) for tex.` );
		}
	}
}

export function getBalloonPositionData( editor ) {
	const view = editor.editing.view;
	const defaultPositions = BalloonPanelView.defaultPositions;

	const selectedElement = view.document.selection.getSelectedElement();
	if ( selectedElement ) {
		return {
			target: view.domConverter.viewToDom( selectedElement ),
			positions: [
				defaultPositions.southArrowNorth,
				defaultPositions.southArrowNorthWest,
				defaultPositions.southArrowNorthEast
			]
		};
	}
	else {
		const viewDocument = view.document;
		return {
			target: view.domConverter.viewRangeToDom( viewDocument.selection.getFirstRange() ),
			positions: [
				defaultPositions.southArrowNorth,
				defaultPositions.southArrowNorthWest,
				defaultPositions.southArrowNorthEast
			]
		};
	}
}

function selectRenderMode( element, preview, previewUid, previewClassName, cb ) {
	if ( preview ) {
		createPreviewElement( element, previewUid, previewClassName, previewEl => {
			cb( previewEl );
		} );
	} else {
		cb( element );
	}
}

function renderMathJax3( equation, element, display, cb ) {
	let promiseFunction = undefined;
	if ( typeof MathJax.tex2chtmlPromise !== 'undefined' ) {
		promiseFunction = MathJax.tex2chtmlPromise;
	} else if ( typeof MathJax.tex2svgPromise !== 'undefined' ) {
		promiseFunction = MathJax.tex2svgPromise;
	}

	if ( typeof promiseFunction !== 'undefined' ) {
		promiseFunction( equation, { display } ).then( node => {
			if ( element.firstChild ) {
				element.removeChild( element.firstChild );
			}
			element.appendChild( node );
			cb();
		} );
	}
}

function renderMathJax2( equation, element, display ) {
	if ( display ) {
		element.innerHTML = '\\[' + equation + '\\]';
	} else {
		element.innerHTML = '\\(' + equation + '\\)';
	}
	// eslint-disable-next-line
	MathJax.Hub.Queue( [ 'Typeset', MathJax.Hub, element ] );
}

function createPreviewElement( element, previewUid, previewClassName, render ) {
	const previewEl = getPreviewElement( element, previewUid, previewClassName );
	render( previewEl );
}

function getPreviewElement( element, previewUid, previewClassName ) {
	let previewEl = global.document.getElementById( previewUid );
	// Create if not found
	if ( !previewEl ) {
		previewEl = global.document.createElement( 'div' );
		previewEl.setAttribute( 'id', previewUid );
		previewEl.classList.add( ...previewClassName );
		previewEl.style.visibility = 'hidden';
		global.document.body.appendChild( previewEl );

		let ticking = false;

		const renderTransformation = () => {
			if ( !ticking ) {
				global.window.requestAnimationFrame( () => {
					moveElement( element, previewEl );
					ticking = false;
				} );

				ticking = true;
			}
		};

		// Create scroll listener for following
		global.window.addEventListener( 'resize', renderTransformation );
		global.window.addEventListener( 'scroll', renderTransformation );
	}
	return previewEl;
}

function moveAndScaleElement( parent, child ) {
	// Move to right place
	moveElement( parent, child );

	// Scale parent element same as preview
	const domRect = child.getBoundingClientRect();
	parent.style.width = domRect.width + 'px';
	parent.style.height = domRect.height + 'px';
}

function moveElement( parent, child ) {
	const domRect = parent.getBoundingClientRect();
	const left = global.window.scrollX + domRect.left;
	const top = global.window.scrollY + domRect.top;
	child.style.position = 'absolute';
	child.style.left = left + 'px';
	child.style.top = top + 'px';
	child.style.zIndex = 'var(--ck-z-modal)';
	child.style.pointerEvents = 'none';
}
