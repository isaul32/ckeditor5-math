import type { KatexOptions } from './typings-external';

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
}

