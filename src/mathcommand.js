import { Command } from 'ckeditor5/src/core';
import { getSelectedMathModelWidget } from './utils';

export default class MathCommand extends Command {
	execute( equation, display, outputType, forceOutputType ) {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedElement = selection.getSelectedElement();

		model.change( writer => {
			let mathtex;
			if ( selectedElement && ( selectedElement.is( 'element', 'mathtex-inline' ) ||
					selectedElement.is( 'element', 'mathtex-display' ) ) ) {
				// Update selected element
				const typeAttr = selectedElement.getAttribute( 'type' );

				// Use already set type if found and is not forced
				const type = forceOutputType ? outputType : typeAttr || outputType;

				mathtex = writer.createElement( display ? 'mathtex-display' : 'mathtex-inline', { equation, type, display } );
			} else {
				// Create new model element
				mathtex = writer.createElement( display ? 'mathtex-display' : 'mathtex-inline', { equation, type: outputType, display } );
			}
			model.insertContent( mathtex );
		} );
	}

	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedElement = selection.getSelectedElement();

		this.isEnabled = selectedElement === null || ( selectedElement.is( 'element', 'mathtex-inline' ) ||
				selectedElement.is( 'element', 'mathtex-display' ) );

		const selectedEquation = getSelectedMathModelWidget( selection );
		this.value = selectedEquation ? selectedEquation.getAttribute( 'equation' ) : null;
		this.display = selectedEquation ? selectedEquation.getAttribute( 'display' ) : null;
	}
}
