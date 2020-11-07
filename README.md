# CKEditor 5 mathematical feature

This is TeX-based mathematical plugin for CKEditor 5. You can use it to insert, edit and view mathematical equations and formulas. This plugin supports MathJax, KaTeX and custom typesetting engines.

## Table of contents
- [Features](#features)
- [Demos](#demos)
- [Screenshots](#screenshots)
- [Requirements](#requirements)
- [Examples](#examples)
- [Installation](#installation)
	* [Styles for Lark theme](#styles-for-lark-theme)
- [Configuration & Usage](#configuration--usage)
	* [Plugin options](#plugin-options)
	* [Available typesetting engines](#available-typesetting-engines)
	* [Supported input and output formats](#supported-input-and-output-formats)
- [Paste support](#paste-support)
	* [From plain text](#from-plain-text)
- [Preview workaround](#preview-workaround)

## Features
- TeX syntax
- Inline and display equations
- Preview view
- Multiple typesetting engines
- Have multiple input and output format
- Paste support
	- from plain text

# Demos
- [Classic editor with MathJax](https://jsfiddle.net/isaul32/qktj9h7x/)
- [Classic editor with KaTex](https://jsfiddle.net/isaul32/3wjrkLdv/)
- [Balloon block editor with KaTex](https://jsfiddle.net/isaul32/q01mu8kp/)

## Screenshots
![Screenshot 1](/screenshots/1.png?raw=true "Screenshot 1")

![Screenshot 2](/screenshots/2.png?raw=true "Screenshot 2")

## Requirements

- Use same major version as your CKEditor 5 build

If you get duplicated modules error, you have mismatching versions.

## Examples
[Link to examples repository](https://github.com/isaul32/ckeditor5-math-examples)

## Installation
Use official classic or inline build as a base:
- [CKEditor 5 classic editor build](https://github.com/ckeditor/ckeditor5-build-classic)
- [CKEditor 5 inline editor build](https://github.com/ckeditor/ckeditor5-build-inline)

Install plugin with NPM or Yarn

`npm install ckeditor5-math --save-dev`

Add import into ckeditor.js file

```js
import Mathematics from 'ckeditor5-math/src/math';
```

Add it to built-in plugins

```js
InlineEditor.builtinPlugins = [
	// ...
	Mathematics
];
```

__Add math button to toolbar__

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
__Copy theme/ckeditor5-math folder__ from [https://github.com/isaul32/ckeditor5/tree/master/packages/ckeditor5-theme-lark](https://github.com/isaul32/ckeditor5/tree/master/packages/ckeditor5-theme-lark) to your lark theme repository

## Configuration & Usage

### Plugin options
```js
InlineEditor.defaultConfig = {
	// ...
	math: {
		engine: 'mathjax', // or katex or function. E.g. (equation, element, display) => { ... }
		lazyLoad: undefined // async () => { ... }, called once before rendering first equation if engine doesn't exist. After resolving promise, plugin renders equations.
		outputType: 'script', // or span
		forceOutputType: false, // forces output to use outputType
		enablePreview: true // Enable preview view
	}
}
```

### Available typesetting engines
__MathJax__
- Tested with __latest 2.7__
- Has experimental (__CHTML__, __SVG__) support for __3.0.0__ or newer version

[<img src="https://www.mathjax.org/badge/badge-square.svg" width="130" alt="KaTeX">](https://www.mathjax.org/)

__KaTeX__
- Tested with version __0.12.0__

[<img src="https://katex.org/img/katex-logo-black.svg" width="130" alt="KaTeX">](https://katex.org/)

__Custom typesetting__

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
- __equation__ is equation in TeX format without delimiters.
- __element__ is DOM element reserved for rendering.
- __display__ is boolean. Typesetting should be inline when false.
- __preview__ is boolean. Rendering in preview when true.


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
Paste TeX equations with __delimiters__. For example:

__\\[__ x=\frac{-b\pm\sqrt{b^2-4ac}}{2a} __\\]__

or

__\\(__ x=\frac{-b\pm\sqrt{b^2-4ac}}{2a} __\\)__

## Preview workaround
__.ck-reset_all *__ css rules from ckeditor5-ui and ckeditor5-theme-lark break rendering in preview mode.

My solution for this is use rendering element outside of CKEditor DOM and place it to right place by using absolute position. Alternative solution could be using iframe, but then typesetting engine's scripts and styles have to copy to child document.
