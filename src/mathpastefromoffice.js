import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Clipboard from '@ckeditor/ckeditor5-clipboard/src/clipboard';
import UpcastWriter from '@ckeditor/ckeditor5-engine/src/view/upcastwriter';
import Matcher from '@ckeditor/ckeditor5-engine/src/view/matcher';
// import Element from '@ckeditor/ckeditor5-engine/src/view/element';
import { normalizeSpacing, normalizeSpacerunSpans } from '@ckeditor/ckeditor5-paste-from-office/src/filters/space';

const BULLET_REGEXP = /(<span style=['"]mso-list:((.||\r?\n)*?)Ignore['"]>((.|\r?\n)*?)<\/span>)/g;

export default class MathPasteFromOffice extends Plugin {
	static get pluginName() {
		return 'MathPasteFromOffice';
	}

	static get requires() {
		return [ Clipboard ];
	}

	init() {
		const editor = this.editor;

		editor.plugins.get( 'Clipboard' ).on(
			'inputTransformation',
			( evt, data ) => {
				console.log( 'isTransformedWithPasteFromOffice', data.isTransformedWithPasteFromOffice ); // eslint-disable-line
				console.log( data.content ); // eslint-disable-line

				if ( data.isTransformedWithMathPasteFromOffice ) {
					return;
				}

				if ( !data.isTransformedWithPasteFromOffice ) {
					console.warn( 'Paste from office must be set before this' );// eslint-disable-line
					return;
				}

				const domParser = new DOMParser(); // eslint-disable-line

				/*
				console.log(htmlString); // eslint-disable-line
				const { body } = parseHtml( htmlString );
				console.log(body); // eslint-disable-line
				*/

				const plainString = data.dataTransfer.getData( 'text/plain' );
				const lines = plainString.split( /\r?\n/ ); // split by new lines
				if ( lines.length > 1 ) {
					lines.pop(); // Remove last new line
				}
				// console.log(plainString); // eslint-disable-line

				const htmlMimeType = 'text/html';
				let htmlString = data.dataTransfer.getData( htmlMimeType );
				// console.log(htmlString); // eslint-disable-line

				htmlString = htmlString.replace( /<!--\[if gte vml 1]>/g, '' );
				htmlString = htmlString.replace( BULLET_REGEXP, '' );

				const normalizedHtml = normalizeSpacing( cleanContentAfterBody( htmlString ) );
				const htmlDocument = domParser.parseFromString( normalizedHtml, htmlMimeType );
				normalizeSpacerunSpans( htmlDocument );

				// const htmlDocument = domParser.parseFromString( htmlString, htmlMimeType );
				// console.log(htmlDocument); // eslint-disable-line

				const parts = htmlDocument.body.children;

				// console.log(parts); // eslint-disable-line

				const partsByLines = [];

				for ( let i = 0; i < parts.length; i++ ) {
					const part = parts[ i ];
					if ( part.tagName.toLowerCase() === 'table' ) {
						// console.log(part); // eslint-disable-line
						const table = part;
						const rows = table.getElementsByTagName( 'tr' );
						for ( let j = 0; j < rows.length; j++ ) {
							const row = rows[ j ];
							partsByLines.push( row );
						}
						// console.log(rows); // eslint-disable-line
					} else {
						partsByLines.push( part );
					}
				}

				// console.log(lines); // eslint-disable-line
				// console.log(parts); // eslint-disable-line
				// console.log(lines.length, partsByLines.length); // eslint-disable-line

				if ( lines.length === partsByLines.length ) {
					for ( let i = 0; i < partsByLines.length; i++ ) {
						const part = partsByLines[ i ];
						const line = lines[ i ];

						const nodes = part.childNodes;
						// console.log( nodes ); // eslint-disable-line

						let lineFromNode = '';
						let equationCounter = 0;
						for ( let j = 0; j < nodes.length; j++ ) {
							const node = nodes[ j ];
							// If node is comment
							const commentType = Node.COMMENT_NODE; // eslint-disable-line
							if ( node.nodeType === commentType ) {
								const commentNode = node;
								// console.log( comment ); // eslint-disable-line
								const comment = commentNode.textContent;
								// console.log(comment); // eslint-disable-line
								if ( comment.match( /\[if gte msEquation 12]>/g ) ) {
									equationCounter++;
								}
							}
							if ( node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE ) { // eslint-disable-line
								// console.log( node.nodeType, node.textContent ); // eslint-disable-line
								lineFromNode += node.textContent;
							}
						}

						// Skip if don't have any equation
						if ( equationCounter === 0 ) {
							continue;
						}

						const equations = collectEquations( line, lineFromNode, equationCounter );
						// console.log( part, equations ); // eslint-disable-line

						const images = part.getElementsByTagName( 'img' );
						// console.log( images ); // eslint-disable-line
						for ( let j = 0; j < images.length; j++ ) {
							const img = images[ j ];
							// console.log( img.src ); // eslint-disable-line

							const mathtex = document.createElement( 'span' ); // eslint-disable-line
							mathtex.classList.add( 'math-tex' );
							mathtex.innerHTML = '\\[' + equations[ j ] + '\\]';

							const parent = img.parentNode;
							parent.replaceChild( mathtex, img );

							// console.log( parent ); // eslint-disable-line
						}
					}

					const writer = new UpcastWriter();
					const documentFragment = data.content;
					const itemLikeElements = findAllItemLikeElements( documentFragment, writer );
					console.log( itemLikeElements ); // eslint-disable-line

					if ( !itemLikeElements.length ) {
						return;
					}

					itemLikeElements.forEach( ( itemLikeElement, i ) => {
						console.log( i, itemLikeElement, itemLikeElement.element ); // eslint-disable-line
						// const item = new Element( 'span' );
					} );
				} else {
					console.warn( 'Lines length is wrong',  lines.length + ' !== ' + partsByLines.length ); // eslint-disable-line
				}

				data.isTransformedWithMathPasteFromOffice = true;
			},
			{ priority: 'high' }
		);
	}
}

function collectEquations( line, lineFromNode, equationCounter ) {
	const equations = [];
	let equation = '';
	let charCounter = 0;
	let newEquation = true;

	// Replace all spaces to non breaking spaces. (Cannot be in equation)
	let lineFiltered = line;
	lineFiltered = lineFiltered.replace( /&nbsp;/g, ' ' );
	lineFiltered = lineFiltered.trim();

	// Remove '\ ' chars
	lineFiltered = lineFiltered.replace( /\\ /g, '' ); // Remove all extra spaces.

	// Try remove all spaces in equation
	lineFiltered = lineFiltered.replace( /{(?=.*?)(?=\\+).*?}/g, match => {
		return match.replace( /\s+/g, '' );
	} ); // Remove all extra spaces.
	lineFiltered = lineFiltered.replace( /\s/g, '\u00A0' ); // Replcae all spaces to non breaking spaces

	let lineFromNodeFiltered = lineFromNode;
	lineFromNodeFiltered = lineFromNodeFiltered.replace( /\r?\n|\r/g, ' ' ); // Line break is same as space
	lineFromNodeFiltered = lineFromNodeFiltered.replace( /&nbsp;/g, ' ' );
	lineFromNodeFiltered = lineFromNodeFiltered.trim();
	lineFromNodeFiltered = lineFromNodeFiltered.replace( /\s/g, '\u00A0' ); // Replcae all spaces to non breaking spaces

	// eslint-disable-next-line
	// console.log( '%c' + lineFiltered + ' %c' + lineFromNodeFiltered + ' %c', 'color:green', 'color:red','color:white' );

	// Let check line char by char
	for ( let j = 0; j < lineFiltered.length; j++ ) {
		const charFromLine = lineFiltered.charAt( j );
		// console.log( charFromLine, lineFiltered.charCodeAt( j ) ); // eslint-disable-line
		const charFromNode = lineFromNodeFiltered.charAt( j - charCounter );
		// Jump to next iteration if same char
		// console.log( charFromLine, charFromNode ); // eslint-disable-line
		if ( charFromLine === charFromNode ) {
			if ( !newEquation ) {
				equations.push( equation.trim() );
				equation = '';
				newEquation = true;
			}
			continue;
		} else {
			equation += charFromLine;
			charCounter++;
			if ( newEquation ) {
				newEquation = false;
			}
		}
	}
	// Add last one
	if ( !newEquation ) {
		equations.push( equation.trim() );
		equation = '';
		newEquation = true;
	}

	if ( equations.length !== equationCounter ) {
		console.warn( 'Couldn\'t parse all equations' ); // eslint-disable-line
	}

	return equations;
}

function cleanContentAfterBody( htmlString ) {
	const regexp = /<\/body>(.*?)(<\/html>|$)/;
	const match = htmlString.match( regexp );

	if ( match && match[ 1 ] ) {
		htmlString = htmlString.slice( 0, match.index ) + htmlString.slice( match.index ).replace( match[ 1 ], '' );
	}

	return htmlString;
}

function findAllItemLikeElements( documentFragment, writer ) {
	const range = writer.createRangeIn( documentFragment );

	// Matcher for finding list-like elements.
	const itemLikeElementsMatcher = new Matcher( {
		name: /^img$/
	} );

	const itemLikeElements = [];

	for ( const value of range ) {
		if ( value.type === 'elementStart' && itemLikeElementsMatcher.match( value.item ) ) {
			itemLikeElements.push( value.item );
		}
	}

	return itemLikeElements;
}
