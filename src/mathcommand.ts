import { Command } from 'ckeditor5/src/core';
import { getSelectedMathModelWidget } from './utils';

export default class MathCommand extends Command {
	public value: string | null = null;
	public execute(
		equation: string,
		display?: boolean,
		outputType: 'script' | 'span' = 'script',
		forceOutputType?: boolean
	): void {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedElement = selection.getSelectedElement();

		model.change( writer => {
			let mathtex;
			if (
				selectedElement &&
				( selectedElement.is( 'element', 'mathtex-inline' ) ||
					selectedElement.is( 'element', 'mathtex-display' ) )
			) {
				// Update selected element
				const typeAttr = selectedElement.getAttribute( 'type' );

				// Use already set type if found and is not forced
				const type = forceOutputType ?
					outputType :
					typeAttr || outputType;

				mathtex = writer.createElement(
					display ? 'mathtex-display' : 'mathtex-inline',
					{ equation, type, display }
				);
			} else {
				// Create new model element
				mathtex = writer.createElement(
					display ? 'mathtex-display' : 'mathtex-inline',
					{ equation, type: outputType, display }
				);
			}
			model.insertContent( mathtex );
		} );
	}

	public display = false;

	public refresh(): void {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedElement = selection.getSelectedElement();

		this.isEnabled =
			selectedElement === null ||
			selectedElement.is( 'element', 'mathtex-inline' ) ||
			selectedElement.is( 'element', 'mathtex-display' );

		const selectedEquation = getSelectedMathModelWidget( selection );
		const value = selectedEquation?.getAttribute( 'equation' );
		this.value = typeof value === 'string' ? value : null;
		const display = selectedEquation?.getAttribute( 'display' );
		this.display = typeof display === 'boolean' ? display : false;
	}
}
