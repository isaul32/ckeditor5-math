# CKEditor 5 mathematical feature &middot; [![GitHub license](https://img.shields.io/badge/license-ISC-blue.svg)](https://github.com/isaul32/ckeditor5-math/blob/master/LICENSE) [![npm version](https://img.shields.io/npm/v/@isaul32/ckeditor5-math.svg?style=flat)](https://www.npmjs.com/package/@isaul32/ckeditor5-math)

ckeditor5-math is a TeX-based mathematical plugin for CKEditor 5. You can use it to insert, edit, and view mathematical equations and formulas. This plugin supports [MathJax], [KaTeX] and custom typesetting engines.

[mathjax]: https://www.mathjax.org/
[katex]: https://katex.org/

## Table of contents

-   [Features](#features)
-   [Demos](#demos)
-   [Screenshots](#screenshots)
-   [Requirements](#requirements)
-   [Examples](#examples)
-   [Installation](#installation)
    -   [Styles for Lark theme](#styles-for-lark-theme)
-   [Configuration & Usage](#configuration--usage)
    -   [Plugin options](#plugin-options)
    -   [Available typesetting engines](#available-typesetting-engines)
    -   [Supported input and output formats](#supported-input-and-output-formats)
-   [Paste support](#paste-support)
    -   [From plain text](#from-plain-text)
-   [Autoformat support](#autoformat-support)
-   [Preview workaround](#preview-workaround)

## Features

-   TeX syntax
-   Inline and display equations
-   Preview view
-   Multiple typesetting engines
-   Have multiple input and output format
-   Paste support
    -   from plain text
-   Autoformat support

# Demos

-   [Classic editor with MathJax](https://jsfiddle.net/isaul32/qktj9h7x/)
-   [Classic editor with KaTex](https://jsfiddle.net/isaul32/3wjrkLdv/)
-   [Balloon block editor with KaTex](https://jsfiddle.net/isaul32/q01mu8kp/)

## Screenshots

![Screenshot 1](/screenshots/1.png?raw=true "Screenshot 1")

![Screenshot 2](/screenshots/2.png?raw=true "Screenshot 2")

## Requirements

-   Use same major version as your CKEditor 5 build

If you get duplicated modules error, you have mismatching versions.

## Examples

[Link to examples repository](https://github.com/isaul32/ckeditor5-math-examples)

## Installation

Use official classic or inline build as a base:

-   [CKEditor 5 classic editor build](https://github.com/ckeditor/ckeditor5/tree/master/packages/ckeditor5-build-classic)
-   [CKEditor 5 inline editor build](https://github.com/ckeditor/ckeditor5/tree/master/packages/ckeditor5-build-inline)

Install plugin with NPM or Yarn

`npm install @isaul32/ckeditor5-math --save-dev`

`yarn add @isaul32/ckeditor5-math --dev`

Add import into ckeditor.js file

```js
import Math from '@isaul32/ckeditor5-math/src/math';
import AutoformatMath from '@isaul32/ckeditor5-math/src/autoformatmath';
```

Add it to built-in plugins

```js
InlineEditor.builtinPlugins = [
	// ...
	Math,
	AutoformatMath
];
```

**Add math button to toolbar**

```js
InlineEditor.defaultConfig = {
	toolbar: {
		items: [
			// ...
			'math'
		]
	}
};
```

### Styles for Lark theme

**Copy theme/ckeditor5-math folder** from [https://github.com/isaul32/ckeditor5/tree/master/packages/ckeditor5-theme-lark](https://github.com/isaul32/ckeditor5/tree/master/packages/ckeditor5-theme-lark) to your lark theme repository

### Using DLL builds

Use the [official DLL build](https://ckeditor.com/docs/ckeditor5/latest/installation/advanced/alternative-setups/dll-builds.html) and additionally load the math plugin:

```html
<script src="path/to/node_modules/@isaul32/ckeditor5-math/build/math.js"></script>
<script>
CKEditor5.editorClassic.ClassicEditor
	.create(editorElement, {
		plugins: [
			CKEditor5.math.Math,
			...
		],
		...
	});
</script>
```

## Configuration & Usage

### Plugin options

```js
InlineEditor.defaultConfig = {
	// ...
	math: {
		engine: 'mathjax', // or katex or function. E.g. (equation, element, display) => { ... }
		lazyLoad: undefined, // async () => { ... }, called once before rendering first equation if engine doesn't exist. After resolving promise, plugin renders equations.
		outputType: 'script', // or span
		className: 'math-tex', // class name to use with span output type, change e.g. MathJax processClass (v2) / processHtmlClass (v3) is set
		forceOutputType: false, // forces output to use outputType
		enablePreview: true, // Enable preview view
		previewClassName: [], // Class names to add to previews
		popupClassName: [], // Class names to add to math popup balloon
		katexRenderOptions: {}  // KaTeX only options for katex.render(ToString)
	}
}
```

### Available typesetting engines

**MathJax**

-   Tested with **latest 2.7**
-   Has experimental (**CHTML**, **SVG**) support for **3.0.0** or newer version

[<img src="https://www.mathjax.org/badge/badge-square.svg" width="130" alt="KaTeX">](https://www.mathjax.org/)

**KaTeX**

-   Tested with version **0.12.0**

[<img src="https://katex.org/img/katex-logo-black.svg" width="130" alt="KaTeX">](https://katex.org/)

-   `katexRenderOptions` - pass [options](https://katex.org/docs/options.html).

	```js
	InlineEditor.defaultConfig = {
		// ...
		math: {
			engine: 'katex'
			katexRenderOptions: {
				macros: {
					"\\neq": "\\mathrel{\\char`≠}",
				},
			},
		}
	}
	```

**Custom typesetting**

Custom typesetting is possible to implement with engine config. For example, custom typesetting feature can be used when use back end rendering.

```js
InlineEditor.defaultConfig = {
	// ...
	math: {
		engine: ( equation, element, display, preview ) => {
			// ...
		}
	}
}
```

-   **equation** is equation in TeX format without delimiters.
-   **element** is DOM element reserved for rendering.
-   **display** is boolean. Typesetting should be inline when false.
-   **preview** is boolean. Rendering in preview when true.

### Supported input and output formats

Supported input and output formats are:

```html
<!-- MathJax style http://docs.mathjax.org/en/v2.7-latest/advanced/model.html#how-mathematics-is-stored-in-the-page -->
<script type="math/tex">\sqrt{\frac{a}{b}}</script>
<script type="math/tex; mode=display">\sqrt{\frac{a}{b}}</script>

<!-- CKEditor 4 style https://ckeditor.com/docs/ckeditor4/latest/features/mathjax.html -->
<span class="math-tex">\( \sqrt{\frac{a}{b}} \)</span>
<span class="math-tex">\[ \sqrt{\frac{a}{b}} \]</span>
```

### Paste support

#### From plain text

Paste TeX equations with **delimiters**. For example:

```latex
\[ x=\frac{-b\pm\sqrt{b^2-4ac}}{2a} \]
```

or

```latex
\( x=\frac{-b\pm\sqrt{b^2-4ac}}{2a} \)
```

### Autoformat support

#### Inline mode

Ctrl+M can be used to add easily math formulas in inline mode.

#### Display mode

Autoformat for math can be used to add formula in display mode on a new line by adding `\[` or `$$`. This feature requires additional autoformat plugin to be added.

Add following lines into your build

```js
// ...
import AutoformatMath from '@isaul32/ckeditor5-math/src/autoformatmath';

InlineEditor.builtinPlugins = [
	// ...
	AutoformatMath
];
```

or use it with DLL build

```html
<script src="path/to/node_modules/@isaul32/ckeditor5-math/build/math.js"></script>
<script>
CKEditor5.editorInline.InlineEditorEditor
	.create(editorElement, {
		plugins: [
			CKEditor5.math.AutoformatMath,
			...
		],
		...
	});
</script>
```

## Preview workaround

`.ck-reset_all *` css rules from ckeditor5-ui and ckeditor5-theme-lark break rendering in preview mode.

My solution for this is use rendering element outside of CKEditor DOM and place it to right place by using absolute position. Alternative solution could be using iframe, but then typesetting engine's scripts and styles have to copy to child document.

## TypeScript users

ckeditor5-math does not have typings yet. TypeScript builds of CKEditor will see
this:

```sh
src/ckeditor.ts:63:18 - error TS7016: Could not find a declaration file for module '@isaul32/ckeditor5-math/src/math'.
'/path/to/your/project/node_modules/@isaul32/ckeditor5-math/src/math.js' implicitly has an 'any' type.

Try `npm i --save-dev @types/isaul32__ckeditor5-math` if it exists or add a new declaration (.d.ts) file containing
`declare module '@isaul32/ckeditor5-math/src/math';`
```

### Workaround for typings

1. Create a `d.ts` declaration file, e.g. `typings/ckeditor5-math.d.ts`

   ```typescript
   declare module '@isaul32/ckeditor5-math';
   declare module '@isaul32/ckeditor5-math/src/math';
   declare module '@isaul32/ckeditor5-math/src/autoformatmath';
   ```
2. In your [`tsconfig.json`](https://www.typescriptlang.org/tsconfig)'s
   root-level [`include`](https://www.typescriptlang.org/tsconfig#include)
   option, make sure your declaration file is covered, e.g.

   ```json
   {
     "extends": "ckeditor5/tsconfig.json",
     "include": [
       "src",
       "typings",
       "../../typings"
      ]
   }
   ```

## Development

Contributions, improvements and bug fixes are welcome. To aid in this, try out
our developer environment w/ live reload support and [CKEditor 5 inspector].

![Development environment](/screenshots/development-environment.png?raw=true "Screenshot of
development environment")

To enter a development loop with hot reload support:

-   `git clone https://github.com/isaul32/ckeditor5-math.git`
-   `cd ckeditor5-math`
-   `yarn`
-   `yarn start`
-   http://localhost:8080

[ckeditor 5 inspector]: https://ckeditor.com/docs/ckeditor5/latest/framework/guides/development-tools.html#ckeditor-5-inspector
