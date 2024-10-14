import { Plugin, ButtonView, Widget } from 'ckeditor5';

import MathUI from './mathui.js';
import MathEditing from './mathediting.js';
import AutoMath from './automath.js';

import mathIcon from '../theme/icons/math.svg';

export default class Math extends Plugin {
	public static get requires() {
		return [ MathEditing, MathUI, AutoMath, Widget ] as const;
	}

	public static get pluginName() {
		return 'Math' as const;
	}

	public init(): void {
		const editor = this.editor;
		const t = editor.t;
		const model = editor.model;

		// Add the "mathButton" to feature components.
		editor.ui.componentFactory.add( 'mathButton', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: t( 'Math' ),
				icon: mathIcon,
				tooltip: true
			} );

			// Insert a text into the editor after clicking the button.
			this.listenTo( view, 'execute', () => {
				model.change( writer => {
					const textNode = writer.createText( 'Hello CKEditor 5!' );

					model.insertContent( textNode );
				} );

				editor.editing.view.focus();
			} );

			return view;
		} );
	}
}
