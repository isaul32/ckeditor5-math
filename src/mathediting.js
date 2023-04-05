import MathCommand from './mathcommand';
import { Plugin } from 'ckeditor5/src/core';
import { toWidget, Widget, viewToModelPositionOutsideModelElement } from 'ckeditor5/src/widget';
import { renderEquation, extractDelimiters } from './utils';

export default class MathEditing extends Plugin {
	static get requires() {
		return [ Widget ];
	}

	static get pluginName() {
		return 'MathEditing';
	}

	constructor( editor ) {
		super( editor );
		editor.config.define( 'math', {
			engine: 'mathjax',
			outputType: 'script',
			className: 'math-tex',
			forceOutputType: false,
			enablePreview: true,
			previewClassName: [],
			popupClassName: [],
			katexRenderOptions: {}
		} );
	}

	init() {
		const editor = this.editor;
		editor.commands.add( 'math', new MathCommand( editor ) );

		this._defineSchema();
		this._defineConverters();

		editor.editing.mapper.on(
			'viewToModelPosition',
			viewToModelPositionOutsideModelElement( editor.model, viewElement => viewElement.hasClass( 'math' ) )
		);
	}

	_defineSchema() {
		const schema = this.editor.model.schema;
		schema.register( 'mathtex-inline', {
			allowWhere: '$text',
			isInline: true,
			isObject: true,
			allowAttributes: [ 'equation', 'type', 'display' ]
		} );

		schema.register( 'mathtex-display', {
			allowWhere: '$block',
			isInline: false,
			isObject: true,
			allowAttributes: [ 'equation', 'type', 'display' ]
		} );
	}

	_defineConverters() {
		const conversion = this.editor.conversion;
		const mathConfig = this.editor.config.get( 'math' );

		// View -> Model
		conversion.for( 'upcast' )
			// MathJax inline way (e.g. <script type="math/tex">\sqrt{\frac{a}{b}}</script>)
			.elementToElement( {
				view: {
					name: 'script',
					attributes: {
						type: 'math/tex'
					}
				},
				model: ( viewElement, { writer } ) => {
					const equation = viewElement.getChild( 0 ).data.trim();
					return writer.createElement( 'mathtex-inline', {
						equation,
						type: mathConfig.forceOutputType ? mathConfig.outputType : 'script',
						display: false
					} );
				}
			} )
			// MathJax display way (e.g. <script type="math/tex; mode=display">\sqrt{\frac{a}{b}}</script>)
			.elementToElement( {
				view: {
					name: 'script',
					attributes: {
						type: 'math/tex; mode=display'
					}
				},
				model: ( viewElement, { writer } ) => {
					const equation = viewElement.getChild( 0 ).data.trim();
					return writer.createElement( 'mathtex-display', {
						equation,
						type: mathConfig.forceOutputType ? mathConfig.outputType : 'script',
						display: true
					} );
				}
			} )
			// CKEditor 4 way (e.g. <span class="math-tex">\( \sqrt{\frac{a}{b}} \)</span>)
			.elementToElement( {
				view: {
					name: 'span',
					classes: [ mathConfig.className ]
				},
				model: ( viewElement, { writer } ) => {
					const equation = viewElement.getChild( 0 ).data.trim();

					const params = Object.assign( extractDelimiters( equation ), {
						type: mathConfig.forceOutputType ? mathConfig.outputType : 'span'
					} );

					return writer.createElement( params.display ? 'mathtex-display' : 'mathtex-inline', params );
				}
			} )
			// KaTeX from Quill: https://github.com/quilljs/quill/blob/develop/formats/formula.js
			.elementToElement( {
				view: {
					name: 'span',
					classes: [ 'ql-formula' ]
				},
				model: ( viewElement, { writer } ) => {
					const equation = viewElement.getAttribute( 'data-value' ).trim();
					return writer.createElement( 'mathtex-inline', {
						equation,
						type: mathConfig.forceOutputType ? mathConfig.outputType : 'script',
						display: false
					} );
				}
			} );

		// Model -> View (element)
		conversion.for( 'editingDowncast' )
			.elementToElement( {
				model: 'mathtex-inline',
				view: ( modelItem, { writer } ) => {
					const widgetElement = createMathtexEditingView( modelItem, writer );
					return toWidget( widgetElement, writer, 'span' );
				}
			} ).elementToElement( {
				model: 'mathtex-display',
				view: ( modelItem, { writer } ) => {
					const widgetElement = createMathtexEditingView( modelItem, writer );
					return toWidget( widgetElement, writer, 'div' );
				}
			} );

		// Model -> Data
		conversion.for( 'dataDowncast' )
			.elementToElement( {
				model: 'mathtex-inline',
				view: createMathtexView
			} )
			.elementToElement( {
				model: 'mathtex-display',
				view: createMathtexView
			} );

		// Create view for editor
		function createMathtexEditingView( modelItem, writer ) {
			const equation = modelItem.getAttribute( 'equation' );
			const display = modelItem.getAttribute( 'display' );

			const styles = 'user-select: none; ' + ( display ? '' : 'display: inline-block;' );
			const classes = 'ck-math-tex ' + ( display ? 'ck-math-tex-display' : 'ck-math-tex-inline' );

			const mathtexView = writer.createContainerElement( display ? 'div' : 'span', {
				style: styles,
				class: classes
			} );

			const uiElement = writer.createUIElement( 'div', null, function( domDocument ) {
				const domElement = this.toDomElement( domDocument );

				renderEquation( equation, domElement, mathConfig.engine, mathConfig.lazyLoad, display, false, mathConfig.previewClassName,
					null, mathConfig.katexRenderOptions );

				return domElement;
			} );

			writer.insert( writer.createPositionAt( mathtexView, 0 ), uiElement );

			return mathtexView;
		}

		// Create view for data
		function createMathtexView( modelItem, { writer } ) {
			const equation = modelItem.getAttribute( 'equation' );
			const type = modelItem.getAttribute( 'type' );
			const display = modelItem.getAttribute( 'display' );

			if ( type === 'span' ) {
				const mathtexView = writer.createContainerElement( 'span', {
					class: mathConfig.className
				} );

				if ( display ) {
					writer.insert( writer.createPositionAt( mathtexView, 0 ), writer.createText( '\\[' + equation + '\\]' ) );
				} else {
					writer.insert( writer.createPositionAt( mathtexView, 0 ), writer.createText( '\\(' + equation + '\\)' ) );
				}

				return mathtexView;
			} else {
				const mathtexView = writer.createContainerElement( 'script', {
					type: display ? 'math/tex; mode=display' : 'math/tex'
				} );

				writer.insert( writer.createPositionAt( mathtexView, 0 ), writer.createText( equation ) );

				return mathtexView;
			}
		}
	}
}
