import Command from '@ckeditor/ckeditor5-core/src/command';
import { getSelectedMathModelWidget } from './utils';

export default class MathCommand extends Command {
	execute( equation, display ) {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedElement = selection.getSelectedElement();

		model.change( writer => {
			let mathtex;
			if ( selectedElement && selectedElement.is( 'mathtex' ) ) {
				// Update selected element
				const mode = selectedElement.getAttribute( 'mode' );
				mathtex = writer.createElement( 'mathtex', { equation, mode, display } );
			} else {
				// Create new model element
				mathtex = writer.createElement( 'mathtex', { equation, mode: 'script', display } );
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
		console.log(selectedEquation);
		this.value = selectedEquation ? selectedEquation.getAttribute( 'equation' ) : null;
		this.display = selectedEquation ? selectedEquation.getAttribute( 'display' ) : null;
	}
}
