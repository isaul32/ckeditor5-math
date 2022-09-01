import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

export default class ChangesBeforeFormView extends Plugin {
	init() {
		console.log('init ChangesBeforeFormView')
		this.changeRangeOfFormulaTyped();
	}

	changeRangeOfFormulaTyped() {

		this.editor.model.document.on( 'change:data', ( evt, batch ) => {
			if ( batch.isUndo || !batch.isLocal /*|| !plugin.isEnabled*/ ) {
				return;
			}

			const model = this.editor.model;
			const selection = model.document.selection;

			const mathCommand = this.editor.commands.get( 'math' );

			// Do nothing if selection is not collapsed.
			if ( !selection.isCollapsed ) {
				return;
			}

			const changes = Array.from( model.document.differ.getChanges() );
			const entry = changes[ 0 ];

			// Typing is represented by only a single change.
			if ( changes.length !== 1 || entry.type !== 'insert' || entry.name !== '$text' || entry.length !== 1 ) {
				console.log('Typing is represented by only a single change.');
			}
			console.log(changes);
			console.log(entry);

			console.log(mathCommand.lastSelectedElement);
			mathCommand.rangeLastSelectedFormula = model.createSelection( mathCommand.lastSelectedElement, 'on' );

		} );
	}
}
