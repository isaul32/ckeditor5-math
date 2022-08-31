import Command from '@ckeditor/ckeditor5-core/src/command';

import { getSelectedMathModelWidget } from './utils';

export default class MathCommand extends Command {

	//values for old selection when new selection in editor is not on formula
	lastSelectedFormulaSelection = null;
	lastSelectedElement = null;
	rangeLastSelectedFormula = null;

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
				model.insertContent( mathtex );
				this.resetMathCommand();

			//updates formula even though selection in editor is not on formula
			} else if ( this.lastSelectedFormulaSelection ) {
				// Update selected element
				const typeAttr = this.lastSelectedElement.getAttribute( 'type' );

				// Use already set type if found and is not forced
				const type = forceOutputType ? outputType : typeAttr || outputType;

				mathtex = writer.createElement( display ? 'mathtex-display' : 'mathtex-inline', { equation, type, display } );
				model.insertContent( mathtex , this.rangeLastSelectedFormula );
				this.resetMathCommand();
			} else {
				// Create new model element
				mathtex = writer.createElement( display ? 'mathtex-display' : 'mathtex-inline', { equation, type: outputType, display } );
				model.insertContent( mathtex );
				this.resetMathCommand();
			}
		} );
	}

	//Reset values after formula is updated or canceled (after cancel button in mathui is pressed)
	resetMathCommand() {
		this.lastSelectedFormulaSelection = null;
		this.lastSelectedElement = null;
		this.rangeLastSelectedFormula = null;
		this.value = null;
		this.display =  null;
	}

	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedElement = selection.getSelectedElement();

		this.isEnabled = selectedElement === null || ( selectedElement.is( 'element', 'mathtex-inline' ) ||
				selectedElement.is( 'element', 'mathtex-display' ) );

		//when a formula is clicked, preserve values for when click out of box happens (selection in editor is not on formula)
		if ( selectedElement !== null && ( selectedElement.is( 'element', 'mathtex-inline' ) || selectedElement.is( 'element', 'mathtex-display' ) ) ) {
			this.lastSelectedFormulaSelection = selection;
			this.rangeLastSelectedFormula = model.createSelection( selection );
			this.lastSelectedElement = selection.getSelectedElement();
		}

		//update values of the formula, otherwise keep old values (needed for keeping stuff when clicking out of the box)
		const selectedEquation = getSelectedMathModelWidget( this.isEnabled ? selection : this.lastSelectedFormulaSelection );
		this.value = selectedEquation ? selectedEquation.getAttribute( 'equation' ) : this.value;
		this.display = selectedEquation ? selectedEquation.getAttribute( 'display' ) : this.display;
	}
}
