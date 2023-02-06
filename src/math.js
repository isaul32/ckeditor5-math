import { Plugin } from 'ckeditor5/src/core';
import { Widget } from 'ckeditor5/src/widget';

import MathUI from './mathui';
import MathEditing from './mathediting';
import AutoMath from './automath';

export default class Math extends Plugin {
	static get requires() {
		return [ MathEditing, MathUI, AutoMath, Widget ];
	}

	static get pluginName() {
		return 'Math';
	}
}
