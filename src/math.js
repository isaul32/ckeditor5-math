import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';

import MathUI from './mathui';
import MathEditing from './mathediting';
import AutoMath from './automath';
import MathPasteFromOffice from './mathpastefromoffice';

export default class Math extends Plugin {
	static get requires() {
		return [ MathEditing, MathUI, Widget, AutoMath, MathPasteFromOffice ];
	}

	static get pluginName() {
		return 'Math';
	}
}
