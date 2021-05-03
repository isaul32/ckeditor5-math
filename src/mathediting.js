import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget, viewToModelPositionOutsideModelElement } from '@ckeditor/ckeditor5-widget/src/utils';
import HtmlDataProcessor from '@ckeditor/ckeditor5-engine/src/dataprocessor/htmldataprocessor';
import ClipboardObserver from '@ckeditor/ckeditor5-clipboard/src/clipboardobserver';
import UpcastWriter from '@ckeditor/ckeditor5-engine/src/view/upcastwriter'

import Widget from '@ckeditor/ckeditor5-widget/src/widget';

import MathCommand from './mathcommand';

import { renderEquation, extractDelimiters } from './utils';

export default class MathEditing extends Plugin {
	static get requires() {
		return [ Widget ];
	}

	static get pluginName() {
		return 'MathEditing';
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

		editor.editing.view.addObserver( ClipboardObserver )

		this.listenTo( editor.editing.view.document, 'clipboardInput', ( evt, data ) => {
            console.log('clipboardInput', evt, data)
		}, { priority: 'highest' } );

        // Copy object
		this.listenTo( editor.editing.view.document, 'copy', ( evt, data ) => {
            console.log('copy', evt, data)
		}, { priority: 'highest' } );

        // Copy object
		this.listenTo( editor.editing.view.document, 'cut', ( evt, data ) => {
            console.log('cut', evt, data)
		}, { priority: 'highest' } );
		this.listenTo( editor.editing.view.document, 'dragstart', ( evt, data ) => {
            console.log('dragstart', evt, data)
		}, { priority: 'highest' } );

            const upcastWriter = new UpcastWriter( editor.editing.view.document );
        // Copy object
		this.listenTo( editor.editing.view.document, 'clipboardOutput', ( evt, data ) => {
            console.log('clipboardOutput', evt, data)
		}, { priority: 'highest' } );
		const mathConfig = this.editor.config.get( 'math' );
		editor.plugins.get( 'ClipboardPipeline' ).on( 'inputTransformation', ( evt, data ) => {
            console.log('ClipboardPipeline, inputTransformation', evt, data, data.content, data.content.childCount)
			const isUrlText = (elem) => {
				console.log('isUrlText', elem)
return true
			}

            // const htmlDataProcessor = new HtmlDataProcessor( viewWriter.document );
            //
            // let mathString = modelItem.getAttribute( 'equation' );
            // console.log('modelItem', mathString)
            //
            // const sourceMathElement = htmlDataProcessor.toView( mathString ).getChild( 0 );

            // return clone( viewWriter, sourceMathElement );

			if ( data.content.childCount == 1 && isUrlText( data.content.getChild( 0 ) ) ) {
				const display = true
				const equation = data.content.getChild( 0 ).data;
console.log(equation, 'equation')
				data.content = upcastWriter.createDocumentFragment( [
					upcastWriter.createElement(
						'script',
						{ type: display ? 'math/tex; mode=display' : 'math/tex' },
						[ upcastWriter.createText( equation ) ]
					)
				] );
			}
		} );
		editor.config.define( 'math', {
			engine: 'mathjax',
			outputType: 'script',
			forceOutputType: false,
			enablePreview: true,
			previewClassName: [],
			popupClassName: []
		} );
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
					classes: [ 'math-tex' ]
				},
				model: ( viewElement, { writer } ) => {
					const equation = viewElement.getChild( 0 ).data.trim();

					const params = Object.assign( extractDelimiters( equation ), {
						type: mathConfig.forceOutputType ? mathConfig.outputType : 'span'
					} );

					return writer.createElement( params.display ? 'mathtex-display' : 'mathtex-inline', params );
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

        this.editor.data.upcastDispatcher.on( 'text', ( evt ) => {
			console.log('upcastDispatcher.on text', evt)
        } );

        this.editor.data.upcastDispatcher.on( 'element', ( evt, data, conversionApi ) => {
            const { consumable, writer } = conversionApi;

			console.log('upcastDispatcher.on element', evt, data, conversionApi)

        } );

        // Data view -> Model
        this.editor.data.upcastDispatcher.on( 'element:span', ( evt, data, conversionApi ) => {
            const { consumable, writer } = conversionApi;
            const viewItem = data.viewItem;

			console.log('upcastDispatcher.on element:span', evt, data, conversionApi, viewItem)

            // When element was already consumed then skip it.
            if ( !consumable.test( viewItem, { name: true } ) ) {
                return;
            }

            // If we encounter any <math> with a LaTeX annotation inside,
            // convert it into a "$$...$$" string.
            let isLatex = mathIsLatex( viewItem );

            // Get the formula of the <math> (which is all its children).
            const processor = new XmlDataProcessor( editor.editing.view.document );

            // Only god knows why the following line makes viewItem lose all of its children,
            // so we obtain isLatex before doing this because we need viewItem's children for that.
            const upcastWriter = new UpcastWriter( editor.editing.view.document );
            const viewDocumentFragment = upcastWriter.createDocumentFragment( viewItem.getChildren() );

            // and obtain the attributes of <math> too!
            const mathAttributes = [ ...viewItem.getAttributes() ]
                .map( ( [ key, value ] ) => ` ${ key }="${ value }"` )
                .join( '' );

            // We process the document fragment
            let formula = processor.toData( viewDocumentFragment ) || '';

            // And obtain the complete formula
            formula = `<math${ mathAttributes }>${ formula }</math>`;

            /* Model node that contains what's going to actually be inserted. This can be either:
            - A <mathml> element with a formula attribute set to the given formula, or
            - If the original <math> had a LaTeX annotation, then the annotation surrounded by "$$...$$" */
            const modelNode = writer.createElement( 'mathml', { formula } );
			modelNode.data = formula;

            // Find allowed parent for element that we are going to insert.
            // If current parent does not allow to insert element but one of the ancestors does
            // then split nodes to allowed parent.
            const splitResult = conversionApi.splitToAllowedParent( modelNode, data.modelCursor );

            // When there is no split result it means that we can't insert element to model tree, so let's skip it.
            if ( !splitResult ) {
                return;
            }

            // Insert element on allowed position.
            conversionApi.writer.insert( modelNode, splitResult.position );

            // Consume appropriate value from consumable values list.
            consumable.consume( viewItem, { name: true } );

            const parts = conversionApi.getSplitParts( modelNode );

            // Set conversion result range.
            data.modelRange = writer.createRange(
                conversionApi.writer.createPositionBefore( modelNode ),
                conversionApi.writer.createPositionAfter( parts[ parts.length - 1 ] )
            );

            // Now we need to check where the `modelCursor` should be.
            if ( splitResult.cursorParent ) {
                // If we split parent to insert our element then we want to continue conversion in the new part of the split parent.
                //
                // before: <allowed><notAllowed>foo[]</notAllowed></allowed>
                // after:  <allowed><notAllowed>foo</notAllowed><converted></converted><notAllowed>[]</notAllowed></allowed>

                data.modelCursor = conversionApi.writer.createPositionAt( splitResult.cursorParent, 0 );
            } else {
                // Otherwise just continue after inserted element.
                data.modelCursor = data.modelRange.end;
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

        function createDataString( modelItem, { writer: viewWriter } ) {
            console.log('createDataString')

            const htmlDataProcessor = new HtmlDataProcessor( viewWriter.document );

            let mathString = modelItem.getAttribute( 'equation' );
            console.log('modelItem', mathString)

            const sourceMathElement = htmlDataProcessor.toView( mathString ).getChild( 0 );

            return clone( viewWriter, sourceMathElement );

        }

        /**
         * Makes a copy of the given view node.
         * @param {module:engine/view/node~Node} sourceNode Node to copy.
         * @returns {module:engine/view/node~Node} Copy of the node.
         */
        function clone( viewWriter, sourceNode ) {
            if ( sourceNode.is( 'text' ) ) {
                return viewWriter.createText( sourceNode.data );
            } else if ( sourceNode.is( 'element' ) ) {

                if ( sourceNode.is( 'emptyElement' ) ) {
                    return viewWriter.createEmptyElement( sourceNode.name, sourceNode.getAttributes() );
                } else {
                    const element = viewWriter.createContainerElement( sourceNode.name, sourceNode.getAttributes() );
                    for ( const child of sourceNode.getChildren() ) {
                        viewWriter.insert( viewWriter.createPositionAt( element, 'end' ) , clone( viewWriter, child ) );
                    }
                    return element;
                }

            }

            throw new Exception('Given node has unsupported type.');

        }

		// Model -> Data
		conversion.for( 'editingDowncast' )
			.elementToElement( {
				model: 'mathtex-inline',
				view: createDataString
			} )
			.elementToElement( {
				model: 'mathtex-display',
				view: createDataString
			} )
			.elementToElement( {
				model: 'script',
				view: createDataString
			} );

		// Create view for editor
		function createMathtexEditingView( modelItem, writer ) {
console.log('createMathtexEditingView', modelItem)
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

				renderEquation( equation, domElement, mathConfig.engine, mathConfig.lazyLoad, display, false );

				return domElement;
			} );

			writer.insert( writer.createPositionAt( mathtexView, 0 ), uiElement );

			return mathtexView;
		}

		// Create view for data
		function createMathtexView( modelItem, { writer } ) {
console.log('createMathtexView', modelItem)
			const equation = modelItem.getAttribute( 'equation' );
			const type = modelItem.getAttribute( 'type' );
			const display = modelItem.getAttribute( 'display' );

			if ( type === 'span' ) {
				const mathtexView = writer.createContainerElement( 'span', {
					class: 'math-tex'
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
