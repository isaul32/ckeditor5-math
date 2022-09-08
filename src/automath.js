import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Undo from '@ckeditor/ckeditor5-undo/src/undo';
import LivePosition from '@ckeditor/ckeditor5-engine/src/model/liveposition';
import global from '@ckeditor/ckeditor5-utils/src/dom/global';

import {
	hasDelimiters,
	delimitersCounts,
	getMathFormsAndText,
	delimitersAreMatching,
	makeFormulas
} from './utils';
import preventDefault from "@ckeditor/ckeditor5-ui/src/bindings/preventdefault";

export default class AutoMath extends Plugin {
	static get requires() {
		return [Undo];
	}

	static get pluginName() {
		return 'AutoMath';
	}

	constructor(editor) {
		super(editor);

		this._timeoutId = null;

		this._notUndoableOperation = -1;
	}

	init() {
		const editor = this.editor;
		const modelDocument = editor.model.document;
		//change < Clipboard > to < 'ClipboardPipeline' > because in version upgrade from 26 to 27
		//the usage of this call changed
		this.listenTo(editor.plugins.get('ClipboardPipeline'), 'inputTransformation', (evt, data) => {

			if (this._notUndoableOperation !== -1) {
				this._notUndoableOperation += 1;
			}

			const firstRange = modelDocument.selection.getFirstRange();

			const leftPosition = firstRange.start;
			leftPosition.stickiness = 'toPrevious';

			const rightPosition = firstRange.end;
			rightPosition.stickiness = 'toNext';

			const rightLivePosition = LivePosition.fromPosition( firstRange.end );
			rightLivePosition.stickiness = 'toNext';
			console.log(leftPosition);
			console.log(rightPosition);
			console.log(rightLivePosition);

			modelDocument.once('change:data', () => {
				this._mathBetweenPositions(leftPosition, rightPosition, rightLivePosition);
				rightLivePosition.detach();
			}, {priority: 'high'});
		});


		editor.commands.get('undo').on('execute', (evt, data) => {
			if (this._timeoutId) {
				global.window.clearTimeout(this._timeoutId);

				this._timeoutId = null;
			}
			if (this._notUndoableOperation === 0) {
				// Stop executing next callbacks.
				evt.stop();
				//evt.cancel();
			} else if (this._notUndoableOperation !== -1) {
				this._notUndoableOperation -= 1;
			}
		}, {priority: 'high'});
	}


	_mathBetweenPositions(leftPosition, rightPosition, rightLivePosition) {
		const editor = this.editor;
		let isAtStartOrEndOfText = false;
		let isMultiLine = false;

		const mathCommand = editor.commands.get('math');
		const mathConfig = this.editor.config.get('math');
		// Do not anything if math element cannot be inserted at the current position
		if (!mathCommand.isEnabled) {
			return;
		}

		if ( leftPosition.path[leftPosition.path.length -1] === 0 ||
			(leftPosition.path[0] === rightLivePosition.path[0] && leftPosition.path[1] === rightLivePosition.path[1])) {
			isAtStartOrEndOfText = true;
		}
		// if the position is at the start,
		rightPosition = editor.model.document.selection.getFirstRange().end;
		rightPosition.stickiness = 'toNext';

		// With timeout user can undo conversation if want use plain text
		this._timeoutId = global.window.setTimeout(() => {
			if (this._notUndoableOperation !== -1) {
				this._notUndoableOperation += 1;
			}
			this._timeoutId = null;
			editor.model.change(writer => {
				const equationRange = writer.createRange(leftPosition, rightPosition);
				let walker = equationRange.getWalker({ignoreElementEnd: true});
				let nodeArray = [];
				for (const node of walker) {
					nodeArray.push(node);
				}
				if (nodeArray.length > 1) {
					isMultiLine = true;
				}

				for (let node of nodeArray) {

					let text = node.item.data;
					let mathFormsAndText = getMathFormsAndText(text);
					if (node.item.is('$textProxy') && hasDelimiters(text) && delimitersCounts(text) % 2 === 0 &&
						mathFormsAndText !== undefined && delimitersAreMatching(mathFormsAndText)) {

						let finishedFormulas = makeFormulas(mathFormsAndText);

						const realRange = writer.createRange(node.previousPosition, node.nextPosition);
						writer.remove(realRange);

						let mathElement;
						for (let i = finishedFormulas.length - 1; i >= 0; i--) {
							if (i % 2 === 0) {
								writer.insertText(finishedFormulas[i], node.previousPosition);
							} else {
								let params = Object.assign(finishedFormulas[i], {
									type: mathConfig.outputType
								});
								mathElement = writer.createElement(params.display ? 'mathtex-display' : 'mathtex-inline', params);
								editor.model.insertContent(mathElement, node.previousPosition);
							}
						}

						if (finishedFormulas.length === 3 && finishedFormulas[0].trim() === '' && finishedFormulas[2].trim() === '') {
							writer.setSelection(mathElement, 'on');
						}
						if (!isAtStartOrEndOfText && isMultiLine) {
							this._notUndoableOperation = 1;
						}
					}
				}
			});
			mathCommand.resetMathCommand();
		}, 100);
	}
}
