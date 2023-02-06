import { Clipboard } from 'ckeditor5/src/clipboard';
import { Plugin } from 'ckeditor5/src/core';
import { LivePosition, LiveRange } from 'ckeditor5/src/engine';
import { Undo } from 'ckeditor5/src/undo';
import { global } from 'ckeditor5/src/utils';
import { extractDelimiters, hasDelimiters, delimitersCounts } from './utils';

export default class AutoMath extends Plugin {
	static get requires() {
		return [ Clipboard, Undo ];
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

		this.listenTo( editor.plugins.get( Clipboard ), 'inputTransformation', () => {
			const firstRange = modelDocument.selection.getFirstRange();

			const leftLivePosition = LivePosition.fromPosition( firstRange.start );
			leftLivePosition.stickiness = 'toPrevious';

			const rightLivePosition = LivePosition.fromPosition( firstRange.end );
			rightLivePosition.stickiness = 'toNext';

			modelDocument.once( 'change:data', () => {
				this._mathBetweenPositions( leftLivePosition, rightLivePosition );

				leftLivePosition.detach();
				rightLivePosition.detach();
			}, { priority: 'high' } );
		} );

		editor.commands.get( 'undo' ).on( 'execute', () => {
			if ( this._timeoutId ) {
				global.window.clearTimeout( this._timeoutId );
				this._positionToInsert.detach();

				this._timeoutId = null;
				this._positionToInsert = null;
			}
		}, { priority: 'high' } );
	}

	_mathBetweenPositions( leftPosition, rightPosition ) {
		const editor = this.editor;

		const mathConfig = this.editor.config.get( 'math' );

		const equationRange = new LiveRange( leftPosition, rightPosition );
		const walker = equationRange.getWalker( { ignoreElementEnd: true } );

		let text = '';

		// Get equation text
		for ( const node of walker ) {
			if ( node.item.is( '$textProxy' ) ) {
				text += node.item.data;
			}
		}

		text = text.trim();

		// Skip if don't have delimiters
		if ( !hasDelimiters( text ) || delimitersCounts( text ) !== 2 ) {
			return;
		}

		const mathCommand = editor.commands.get( 'math' );

		// Do not anything if math element cannot be inserted at the current position
		if ( !mathCommand.isEnabled ) {
			return;
		}

		this._positionToInsert = LivePosition.fromPosition( leftPosition );

		// With timeout user can undo conversation if want use plain text
		this._timeoutId = global.window.setTimeout( () => {
			editor.model.change( writer => {
				this._timeoutId = null;

				writer.remove( equationRange );

				let insertPosition;

				// Check if position where the math element should be inserted is still valid.
				if ( this._positionToInsert.root.rootName !== '$graveyard' ) {
					insertPosition = this._positionToInsert;
				}

				editor.model.change( innerWriter => {
					const params = Object.assign( extractDelimiters( text ), {
						type: mathConfig.outputType
					} );
					const mathElement = innerWriter.createElement( params.display ? 'mathtex-display' : 'mathtex-inline', params );

					editor.model.insertContent( mathElement, insertPosition );

					innerWriter.setSelection( mathElement, 'on' );
				} );

				this._positionToInsert.detach();
				this._positionToInsert = null;
			} );
		}, 100 );
	}
}
