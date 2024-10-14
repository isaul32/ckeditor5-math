import { blockAutoformatEditing, global, logWarning, Plugin } from 'ckeditor5';
import Math from './math.js';
import MathCommand from './mathcommand.js';
import MathUI from './mathui.js';

export default class AutoformatMath extends Plugin {
	public static get requires() {
		return [ Math, 'Autoformat' ] as const;
	}

	/**
	 * @inheritDoc
	 */
	public init(): void {
		const editor = this.editor;

		if ( !editor.plugins.has( 'Math' ) ) {
			logWarning( 'autoformat-math-feature-missing', editor );
		}
	}

	public afterInit(): void {
		const editor = this.editor;
		const command = editor.commands.get( 'math' );

		if ( command instanceof MathCommand ) {
			const callback = () => {
				if ( !command.isEnabled ) {
					return false;
				}

				command.display = true;

				// Wait until selection is removed.
				global.window.setTimeout(
					() => {
						const mathUIInstance = editor.plugins.get( 'MathUI' );
						if ( mathUIInstance instanceof MathUI ) {
							mathUIInstance._showUI();
						}
					},
					50
				);
			};

			// @ts-expect-error: blockAutoformatEditing expects an Autoformat instance even though it works with any Plugin instance
			blockAutoformatEditing( editor, this, /^\$\$$/, callback );
			// @ts-expect-error: blockAutoformatEditing expects an Autoformat instance even though it works with any Plugin instance
			blockAutoformatEditing( editor, this, /^\\\[$/, callback );
		}
	}

	public static get pluginName() {
		return 'AutoformatMath' as const;
	}
}
