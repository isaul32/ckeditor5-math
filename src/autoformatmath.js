import { Plugin } from 'ckeditor5/src/core';
import { global, logWarning } from 'ckeditor5/src/utils';
import blockAutoformatEditing from '@ckeditor/ckeditor5-autoformat/src/blockautoformatediting';
import Math from './math';

export default class AutoformatMath extends Plugin {
	static get requires() {
		return [ Math, 'Autoformat' ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		if ( !editor.plugins.has( 'Math' ) ) {
			logWarning( 'autoformat-math-feature-missing', editor );
		}
	}

	afterInit() {
		const editor = this.editor;
		const command = editor.commands.get( 'math' );

		if ( command ) {
			const callback = () => {
				if ( !command.isEnabled ) {
					return false;
				}

				command.display = true;

				// Wait until selection is removed.
				global.window.setTimeout(
					() => editor.plugins.get( 'MathUI' )._showUI(),
					50
				);
			};

			blockAutoformatEditing( editor, this, /^\$\$$/, callback );
			blockAutoformatEditing( editor, this, /^\\\[$/, callback );
		}
	}

	static get pluginName() {
		return 'AutoformatMath';
	}
}
