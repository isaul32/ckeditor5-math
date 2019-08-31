import Command from '@ckeditor/ckeditor5-core/src/command';
import { getSelectedMathModelWidget } from './utils';

export default class MathCommand extends Command {
	execute( equation ) {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedElement = selection.getSelectedElement();

		model.change( writer => {
			let mathtex;
			if ( selectedElement && selectedElement.is( 'mathtex' ) ) {
				// Update selected element
				const mode = selectedElement.getAttribute( 'mode' );
				const display = selectedElement.getAttribute( 'display' );
				mathtex = writer.createElement( 'mathtex', { equation, mode, display } );
			} else {
				// Create new model element
				mathtex = writer.createElement( 'mathtex', { equation, mode: 'script', display: true } );
			}
			model.insertContent( mathtex );
			writer.setSelection( mathtex, 'on' );
		} );
	}

	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;

		const isAllowed = model.schema.checkChild( selection.focus.parent, 'mathtex' );
		this.isEnabled = isAllowed;

		const selectedEquation = getSelectedMathModelWidget( selection );
		this.value = selectedEquation ? selectedEquation.getAttribute( 'equation' ) : null;
	}
}
