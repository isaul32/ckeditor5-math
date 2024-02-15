import { Plugin } from 'ckeditor5/src/core';
import { Widget } from 'ckeditor5/src/widget';

import MathUI from './mathui';
import MathEditing from './mathediting';
import AutoMath from './automath';

export default class Math extends Plugin {
	public static get requires() {
		return [ MathEditing, MathUI, AutoMath, Widget ] as const;
	}

	public static get pluginName() {
		return 'Math' as const;
	}
}
