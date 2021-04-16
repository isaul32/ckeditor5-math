import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Autoformat from '@ckeditor/ckeditor5-autoformat/src/autoformat';
import blockAutoformatEditing from '@ckeditor/ckeditor5-autoformat/src/blockautoformatediting';

import Math from './math';

export default class AutoformatMath extends Plugin {
	static get requires() {
		return [ Math, Autoformat ];
	}

	afterInit() {
		const editor = this.editor;
		const command = editor.commands.get( 'math' );

		if ( command ) {
			const mathBlockCallback = getCallbackFunctionForBlockAutoformat( editor, command );

			blockAutoformatEditing( editor, this, /^\\\[$/, mathBlockCallback );
			blockAutoformatEditing( editor, this, /^\$\$$/, mathBlockCallback );
		}
	}

	static get pluginName() {
		return 'AutoformatMath';
	}
}

function getCallbackFunctionForBlockAutoformat( editor, command ) {
	return () => {
		if ( !command.isEnabled ) {
			return false;
		}

		command.display = true;
		editor.plugins.get( 'MathUI' )._showUI();
	};
}
