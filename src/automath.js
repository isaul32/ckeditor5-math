import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Undo from '@ckeditor/ckeditor5-undo/src/undo';
import LiveRange from '@ckeditor/ckeditor5-engine/src/model/liverange';
import LivePosition from '@ckeditor/ckeditor5-engine/src/model/liveposition';
import global from '@ckeditor/ckeditor5-utils/src/dom/global';

import {
	extractDelimiters,
	hasDelimiters,
	delimitersCounts,
	getMathFormsAndText,
	delimitersAreMatching,
	openingBrackets, closingBrackets, makeFormulas
} from './utils';
import {elementAt} from "rxjs";

export default class AutoMath extends Plugin {
	static get requires() {
		return [ Undo ];
	}

	static get pluginName() {
		return 'AutoMath';
	}

	constructor( editor ) {
		super( editor );

		this._timeoutId = null;

		this._positionToInsert = null;
	}

	init() {
		const editor = this.editor;
		const modelDocument = editor.model.document;
		const view = editor.editing.view;
		//change < Clipboard > to < 'ClipboardPipeline' > because in version upgrade from 26 to 27
		//the usage of this call changed
		console.log('1');
		this.listenTo( editor.plugins.get( 'ClipboardPipeline' ), 'inputTransformation', (evt, data) => {
			/*for( const element of data.content.getChildren() ) {
				console.log( element );
				document.ad = element;
				for (const innerElem of element.getChildren()) {
					document.lastElem = innerElem;
					if (innerElem.data !== undefined &&
						!hasDelimiters( innerElem.data )
						&& delimitersCounts( innerElem.data ) % 2 === 0 ) {
						this._convertToMath( innerElem );
					}
				}
			}*/
			const dataTransfer = data.dataTransfer;
			console.log('2');
			/*console.log(evt);
			console.log(data);
			console.log(dataTransfer);*/
			/*document.dataTransfer = dataTransfer;
			console.log(dataTransfer.getData( 'text/plain'));*/

			const firstRange = modelDocument.selection.getFirstRange();
			document.firstRange = firstRange;
			const allRanges = modelDocument.selection.getRanges();
			console.log(allRanges);
			for (let a of allRanges) {
				console.log(a);
			}
			document.allRanges = allRanges;

			//let content = data.content || '';
			if ( dataTransfer.getData( 'text/html' ) ) {
				console.log('html');
				//content = normalizeClipboardHtml( dataTransfer.getData( 'text/html' ) );
			} else if ( dataTransfer.getData( 'text/plain' ) ) {
				console.log('plain');
				//content = plainTextToHtml( dataTransfer.getData( 'text/plain' ) );
			}

			console.log(modelDocument.selection);
			document.aa = modelDocument.selection;
			const leftLivePosition = LivePosition.fromPosition( firstRange.start );
			leftLivePosition.stickiness = 'toPrevious';

			const rightLivePosition = LivePosition.fromPosition( firstRange.end );
			rightLivePosition.stickiness = 'toNext';

			modelDocument.once( 'change:data', () => {
				console.log('3');
				this._mathBetweenPositions( leftLivePosition, rightLivePosition );

				leftLivePosition.detach();
				rightLivePosition.detach();
			}, { priority: 'high' } );
		} );

		editor.commands.get( 'undo' ).on( 'execute', () => {
			console.log('4');
			if ( this._timeoutId ) {
				global.window.clearTimeout( this._timeoutId );
				this._positionToInsert.detach();

				this._timeoutId = null;
				this._positionToInsert = null;
			}
		}, { priority: 'high' } );
	}

	_convertToMath( element ) {
		this.editor.model.change( writer => {
			const range = writer.createRangeOn( element );
			console.log( range );
		} );
	}


	_mathBetweenPositions( leftPosition, rightPosition ) {
		console.log('5');
		const editor = this.editor;

		const mathConfig = this.editor.config.get( 'math' );

		console.log(leftPosition);
		console.log(rightPosition);

		const equationRange = new LiveRange( leftPosition, rightPosition );
		const walker = equationRange.getWalker( { ignoreElementEnd: true } );

		let text = '';

		document.walker = walker;

		let noMath = true;
		// Get equation text
		for ( const node of walker ) {
			console.log(node);
			// Skip if don't have delimiters
			if (  node.item.is( '$textProxy' ) && hasDelimiters( node.item.data ) && delimitersCounts( node.item.data ) % 2 === 0 ) {
				noMath = false;
			}
		}

		//return if no node has any math
		if (noMath) {
			return;
		}

		/*let mathFormsAndText = getMathFormsAndText( text );
		console.log(mathFormsAndText);
		console.log('delimsAreMatching');
		console.log(delimitersAreMatching( mathFormsAndText ));

		if (mathFormsAndText === undefined || delimitersAreMatching( mathFormsAndText ) === false) {
			return;
		}
		console.log(mathFormsAndText);

		let finishedFormulas = makeFormulas( mathFormsAndText );
*/
		const mathCommand = editor.commands.get( 'math' );

		// Do not anything if math element cannot be inserted at the current position
		if ( !mathCommand.isEnabled ) {
			return;
		}
		console.log('8');
		this._positionToInsert = LivePosition.fromPosition( leftPosition, {stickiness: 'toNext'} );

		let realLeftPosition = null;
		let realRightPosition = null;

		// With timeout user can undo conversation if want use plain text
		this._timeoutId = global.window.setTimeout( () => {
			console.log('9');
			editor.model.change( writer => {
				this._timeoutId = null;

				let insertPosition;

				// Check if position where the math element should be inserted is still valid.
				if ( this._positionToInsert.root.rootName !== '$graveyard' ) {
					insertPosition = this._positionToInsert;
				}
				console.log('10');
				let walkerino = equationRange.getWalker( { ignoreElementEnd: true } );
				let nodeArray = [];
				for ( const node of walkerino ) {
					nodeArray.push(node);
				}
				//nodeArray.reverse();
				for (let node of nodeArray) {
					if ( this._positionToInsert !== null && this._positionToInsert.root.rootName !== '$graveyard' ) {
						insertPosition = this._positionToInsert;
					}
					text = node.item.data;
					console.log(text);
					let mathFormsAndText = getMathFormsAndText( text );

					if ( !node.item.is( '$textProxy' ) || !hasDelimiters( text ) || delimitersCounts( text ) % 2 !== 0 ||
						mathFormsAndText === undefined || !delimitersAreMatching( mathFormsAndText ) ) {
						editor.model.change(innerWriter => {
							console.log('not math');

							realLeftPosition = node.previousPosition;
							realRightPosition = node.nextPosition;
							const realRange = new LiveRange( realLeftPosition, realRightPosition );

							writer.remove( realRange );
							writer.insert( node, insertPosition );
						});
						walkerino = equationRange.getWalker( { ignoreElementEnd: true } );
					} else {

					let finishedFormulas = makeFormulas( mathFormsAndText );

					editor.model.change(innerWriter => {
						console.log('math');
						realLeftPosition = node.previousPosition;
						realRightPosition = node.nextPosition;
						const realRange = new LiveRange(realLeftPosition, realRightPosition);

						writer.remove(realRange);

						let mathElement;
						for (let i = finishedFormulas.length - 1; i >= 0; i--) {
							if (i % 2 === 0) {
								console.log('insertText');
								writer.insertText(finishedFormulas[i], insertPosition);
							} else {
								console.log('insertMath');
								let params = Object.assign(finishedFormulas[i], {
									type: mathConfig.outputType
								});
								mathElement = innerWriter.createElement(params.display ? 'mathtex-display' : 'mathtex-inline', params);
								editor.model.insertContent(mathElement, insertPosition);
							}
						}

						if (finishedFormulas.length === 3 && finishedFormulas[0].trim() === '' && finishedFormulas[2].trim() === '') {
							innerWriter.setSelection(mathElement, 'on');
						}

						/*const params = Object.assign( extractDelimiters( text ), {
							type: mathConfig.outputType
						} );

						console.log(params);
						const mathElement = innerWriter.createElement( params.display ? 'mathtex-display' : 'mathtex-inline', params );

						editor.model.insertContent( mathElement, insertPosition );


						innerWriter.setSelection( mathElement, 'on' );*/
						walkerino = equationRange.getWalker( { ignoreElementEnd: true } );
					});
				} }
			} );
			if ( this._positionToInsert !== null ) {
				this._positionToInsert.detach();
			}
			this._positionToInsert = null;
			//don't make mathui appear after clicking after pasting formula into editor
			mathCommand.resetMathCommand();
		}, 100 );
	}
}
