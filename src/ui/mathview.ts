import { View } from 'ckeditor5/src/ui';
import { renderEquation } from '../utils';
import type { Locale } from 'ckeditor5/src/utils';
import type { KatexOptions } from 'katex';

export default class MathView extends View {
	public value = '';
	public display = false;
	public previewUid: string;
	public previewClassName: Array<string>;
	public katexRenderOptions: KatexOptions;
	public engine:
		| 'mathjax'
		| 'katex'
		| ((equation: string, element: HTMLElement, display: boolean) => void);
	public lazyLoad: undefined | (() => Promise<void>);

	constructor(
		engine:
			| 'mathjax'
			| 'katex'
			| ((
					equation: string,
					element: HTMLElement,
					display: boolean,
			  ) => void),
		lazyLoad: undefined | (() => Promise<void>),
		locale: Locale,
		previewUid: string,
		previewClassName: Array<string>,
		katexRenderOptions: KatexOptions,
	) {
		super(locale);

		this.engine = engine;
		this.lazyLoad = lazyLoad;
		this.previewUid = previewUid;
		this.katexRenderOptions = katexRenderOptions;
		this.previewClassName = previewClassName;

		this.set('value', '');
		this.set('display', false);

		this.on('change', () => {
			if (this.isRendered) {
				this.updateMath();
			}
		});

		this.setTemplate({
			tag: 'div',
			attributes: {
				class: ['ck', 'ck-math-preview'],
			},
		});
	}

	public updateMath(): void {
		renderEquation(
			this.value,
			this.element!,
			this.engine,
			this.lazyLoad,
			this.display,
			true,
			this.previewUid,
			this.previewClassName,
			this.katexRenderOptions,
		);
	}

	public render(): void {
		super.render();
		this.updateMath();
	}
}
