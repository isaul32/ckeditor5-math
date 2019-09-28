# CKEditor 5 mathematical feature

This is the best TeX-based mathematical plugin for CKEditor 5. You can use it to insert, edit and view mathematical equation and formulas. This plugin supports MathJax, KaTeX and custom typesetting engines.

## Demo (todo)
[Link to classic editor demo](https://www.example.com)

[Link to inline editor demo](https://www.example.com)

## Installation
Install plugin with NPM or Yarn

`npm install ckeditor5-math --save-dev`

Add import into ckeditor.js file

```js
import Mathematics from 'ckeditor5-math/src/math';
```

Add it to builtinPlugins

```js
InlineEditor.builtinPlugins = [
	// ...
	Mathematics
];
```

__Add math button to toolbar__ and optional math config to default config

```js
InlineEditor.defaultConfig = {
	toolbar: {
		items: [
			// ...
			'math'
		]
	},
	// ...
	math: {
		engine: 'mathjax',
		outputType: 'script',
		forceOutputType: false
	}
};
```
### Copying plugin's theme for Lark
Copy __theme/ckeditor5-math__ folder from [https://github.com/isaul32/ckeditor5-theme-lark](https://github.com/isaul32/ckeditor5-theme-lark) to your lark theme repository fork.

### Styles
Styles requires PostCSS like offical CKEditor plugins.

## Configuration & Usage

### Available typesetting engines
__MathJax__
- Tested by using version __2.7.5__ and __TeX-MML-AM_HTMLorMML__ configuration. It works also with version __3.0.0__ or newer!
- Use __\\( \\)__ delimiters for inline and __\\[ \\]__ delimiters for display

__KaTeX__
- Tested by using version __0.11.0__
- Doesn't support preview feature because __.ck-reset_all *__ css rules from ckeditor5-ui and ckeditor5-theme-lark breaks it.

__Custom__
It's possible to implement with engine config. For example, this feature can be used when use back end rendering.
```js
InlineEditor.defaultConfig = {
	// ...
	math: {
		engine: (equation, element, display) => {
			// ...
		}
	}
}
```
- __equation__ is equation in TeX format without delimiters
- __element__ is DOM element reserved for rendering
- __display__ is boolean. Typesetting should be inline when false


### Plugin options
```js
InlineEditor.defaultConfig = {
    // ...
    math: {
        engine: 'mathjax', // or katex or function (equation, element, display) => { ... }
        outputType: 'script', // or span or math
        forceOutputType: false // forces output to use outputType
    }
}
```

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

### Math paste support
It's possible to paste equations in mathtex by using __delimiters__. For example:
- __\\(__ x=\frac{-b\pm\sqrt{b^2-4ac}}{2a} __\\)__ (inline mode)
- __\\[__ x=\frac{-b\pm\sqrt{b^2-4ac}}{2a} __\\]__ (display mode)

## Todo
- Convert equations to mathtex when paste document from word
- Fix KaTex preview
- Make better way to import lark theme for plugin
- MathML input and output when using MathJax version 3
