import InputView from '@ckeditor/ckeditor5-ui/src/input/inputview';

export default class TextareaView extends InputView {
	constructor( locale ) {
		super( locale );
		this.setTemplate( {
			...this.template,
			tag: 'textarea'
		} );
	}
}
