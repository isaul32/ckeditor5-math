import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Undo from '@ckeditor/ckeditor5-undo/src/undo';
import global from '@ckeditor/ckeditor5-utils/src/dom/global';

export default class Test extends Plugin {
	static get requires() {
		return [Undo];
	}

	static get pluginName() {
		return 'Test';
	}

	constructor(editor) {
		super(editor);
		this._timeoutId = null;
	}

	init() {
		const editor = this.editor;
		const modelDocument = editor.model.document;
		const view = editor.editing.view;
		//change < Clipboard > to < 'ClipboardPipeline' > because in version upgrade from 26 to 27
		//the usage of this call changed
		this.listenTo(editor.plugins.get('ClipboardPipeline'), 'inputTransformation', (evt, data) => {
			const firstRange = modelDocument.selection.getFirstRange();

			const leftPosition = firstRange.start;
			leftPosition.stickiness = 'toPrevious';

			const rightPosition = firstRange.end;
			rightPosition.stickiness = 'toNext';

			modelDocument.once('change:data', () => {
				this._boldBetweenPositions(leftPosition, rightPosition);
			}, {priority: 'high'});
		});

		editor.commands.get('undo').on('execute', () => {
			if (this._timeoutId) {
				global.window.clearTimeout(this._timeoutId);
				this._timeoutId = null;
			}
		}, {priority: 'high'});
	}


	_boldBetweenPositions(leftPosition, rightPosition) {
		const editor = this.editor;
		// if the position is at the start, or at the end
		rightPosition = editor.model.document.selection.getFirstRange().end;
		rightPosition.stickiness = 'toNext';

		// With timeout user can undo conversation if wants to use plain text
		this._timeoutId = global.window.setTimeout(() => {
			this._timeoutId = null;

			editor.model.change(writer => {
				const textRange = writer.createRange(leftPosition, rightPosition);

				let walker = textRange.getWalker({ignoreElementEnd: true});
				let nodeArray = [];
				for (const node of walker) { // remember nodes, because when they are changed model-textproxy-wrong-length error occurs
					nodeArray.push(node);
				}
				for (let node of nodeArray) {
					let text = node.item.data;
					//do this operation only when the text matches the delimiters
					if (node.item.is('$textProxy') && text !== undefined && text.match(/&/g)) {
						let boldAndPlain = this._split(text);
						const rangeToRemove = writer.createRange(node.previousPosition, node.nextPosition);
						writer.remove(rangeToRemove);

						for (let i = boldAndPlain.length - 1; i >= 0; i--) {
							if (i % 2 === 0) {
								writer.insertText(boldAndPlain[i], node.previousPosition);
							} else {
								writer.insertText(boldAndPlain[i], {bold: true}, node.previousPosition);
							}
						}
					}
				}
			});
		}, 100);
	}

	_split(text) {
		let boldPlainDelimitersArray = text.split(/(&)/g);
		let boldPlainArray = [];
		for (let i = 0; i < boldPlainDelimitersArray.length; i++) {
			if (i % 4 === 0) {
				boldPlainArray.push(boldPlainDelimitersArray[i]);

			} else if (i % 2 === 0) {
				boldPlainArray.push(boldPlainDelimitersArray[i]);
			}
		}
		return boldPlainArray;
	}
}
