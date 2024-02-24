import { Plugin } from 'ckeditor5/src/core';
import { global, logWarning } from 'ckeditor5/src/utils';
// eslint-disable-next-line ckeditor5-rules/allow-imports-only-from-main-package-entry-point
import blockAutoformatEditing from '@ckeditor/ckeditor5-autoformat/src/blockautoformatediting';
import Math from './math';
import type MathCommand from './mathcommand';
import type MathUI from './mathui';

export default class AutoformatMath extends Plugin {
	public static get requires() {
		return [Math, 'Autoformat'] as const;
	}

	/**
	 * @inheritDoc
	 */
	public init(): void {
		const editor = this.editor;

		if (!editor.plugins.has('Math')) {
			logWarning('autoformat-math-feature-missing', editor);
		}
	}

	public afterInit(): void {
		const editor = this.editor;
		const command: MathCommand = editor.commands.get(
			'math',
		)! as MathCommand;

		if (command) {
			const callback = () => {
				if (!command.isEnabled) {
					return false;
				}

				command.display = true;

				// Wait until selection is removed.
				global.window.setTimeout(
					() => (editor.plugins.get('MathUI') as MathUI)._showUI(),
					50,
				);
			};

			// @ts-expect-error: blockAutoformatEditing expects an Autoformat instance even though it works with any Plugin instance
			blockAutoformatEditing(editor, this, /^\$\$$/, callback);
			// @ts-expect-error: blockAutoformatEditing expects an Autoformat instance even though it works with any Plugin instance
			blockAutoformatEditing(editor, this, /^\\\[$/, callback);
		}
	}

	public static get pluginName() {
		return 'AutoformatMath' as const;
	}
}
