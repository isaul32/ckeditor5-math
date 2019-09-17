# CKEditor 5 mathematical feature

This package is the best TeX-based math plugin for CKEditor 5. You can use it to insert, edit and view mathematical equation / formulas. This plugin supports MathJax, KaTeX and custom typesetting engines.

## Supported input and output formats
Supported input and output formats are:
```html
<!-- MathJax style http://docs.mathjax.org/en/v2.7-latest/advanced/model.html#how-mathematics-is-stored-in-the-page -->
<script type="math/tex">\sqrt{\frac{a}{b}}</script>
<script type="math/tex; mode=display">\sqrt{\frac{a}{b}}</script>
<!-- CKEditor 4 style https://ckeditor.com/docs/ckeditor4/latest/features/mathjax.html -->
<span class="math-tex">\( \sqrt{\frac{a}{b}} \)</span>
<span class="math-tex">\[ \sqrt{\frac{a}{b}} \]</span>
```

## Available typesetting engines
### MathJax
- Tested by using version __2.7.5__ and __TeX-MML-AM_HTMLorMML__ configuration
- Use __\\( \\)__ delimiters for inline and __\\[ \\]__ delimiters for display
### KaTeX
- Tested by using version __0.11.0__
- Doesn't support preview feature because __.ck-reset_all *__ css rules from ckeditor5-ui and ckeditor5-theme-lark breaks it.
### Custom
It's possible with _engine: (__equation__, __element__, __display__) => { ... }_ math config.
- __equation__ is equation in TeX format without delimiters
- __element__ is DOM element reserved for rendering
- __display__ is boolean. Typesetting should be inline when false


## Plugin options
```js
InlineEditor.defaultConfig = {
    // ...
    math: {
        engine: 'mathjax', // or katex or function (equation, element, display) => { ... }
        outputType: 'script', // or span
        forceOutputType: false
    }
    // ...
}
```
## Styles
- Styles requires PostCSS like offical CKEditor plugins