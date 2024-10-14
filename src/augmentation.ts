import type { KatexOptions } from './typings-external.js';
import type { Math } from './index.js';

declare module '@ckeditor/ckeditor5-core' {
	interface EditorConfig {
		math?: {
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
		};
	}
	interface PluginsMap {
		[ Math.pluginName ]: Math;
	}
}
