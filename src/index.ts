/**
 * @module math
 */

import { type KatexOptions } from 'katex';

export { default as Math } from './math';
export { default as AutoformatMath } from './autoformatmath';

export interface MathConfig {
	engine?:
		| 'mathjax'
		| 'katex'
		| ( ( equation: string, element: HTMLElement, display: boolean ) => void )
		| undefined;
	lazyLoad?: undefined | ( () => Promise<void> );
	outputType?: 'script' | 'span' | undefined;
	className?: string | undefined;
	forceOutputType?: boolean | undefined;
	enablePreview?: boolean | undefined;
	previewClassName?: Array<string> | undefined;
	popupClassName?: Array<string> | undefined;
	katexRenderOptions?: Partial<KatexOptions> | undefined;
}

export interface MathConfigDefaults {
	engine:
		| 'mathjax'
		| 'katex'
		| ( ( equation: string, element: HTMLElement, display: boolean ) => void );
	lazyLoad: undefined | ( () => Promise<void> );
	outputType: 'script' | 'span';
	className: string;
	forceOutputType: boolean;
	enablePreview: boolean;
	previewClassName: Array<string>;
	popupClassName: Array<string>;
	katexRenderOptions: Partial<KatexOptions>;
}
