import { ListView } from '@ckeditor/ckeditor5-ui';
import View from '@ckeditor/ckeditor5-ui/src/view';
import { groupBy } from 'lodash';
import svgIcons from '../../assets/math-shortcut-icons';
import global from "@ckeditor/ckeditor5-utils/src/dom/global";

// choosen category
let activeCategory = 'Allgemein';
let inputField = null;
let previewField = null;

// icons
const icons = svgIcons.map(icon => {
    const img = new View();
    img.setTemplate({
        tag: 'img',
        attributes: {
            id: icon.command,
            class: ['math-icon'],
            src: icon.path
        }
    });
    img.render();

    return {
        element: img.element,
        category: icon.category
    };
});

// icons grouped by category
const groupedCommands = groupBy(icons, icon => icon.category);

// categories labels
const categories = Object.keys(groupedCommands).map(cat => {
    const p = document.createElement('p');
    p.id = cat;
    p.innerText = cat;
    if(p.id == activeCategory) p.classList.add('active');

    p.onmousedown = (e) => {
		for (let a of categories) {
			a.classList.remove('active')
		}
		e.preventDefault();
		activeCategory = p.innerText;
		p.classList.add('active');
		renderCommands(activeCategory);
		//inputField.inputView.focus();
	}

    return p;
});


// commands list
const ul = document.createElement('ul');
ul.id = 'commands-list';
ul.classList.add('commands-list');

const renderCommands = (category) => {
	ul.innerHTML = '';

	for (const command of groupedCommands[category]) {
		const li = document.createElement('li');

		li.onclick = () => {
			pasteHtmlAtCaret(command.element.id, false); //todo check if better true or false
			renderCommands(activeCategory);
		}
		li.appendChild(command.element);
		ul.appendChild(li);
	}

	return ul;
}

// copied from https://stackoverflow.com/questions/6690752/insert-html-at-caret-in-a-contenteditable-div
function pasteHtmlAtCaret(html, selectPastedContent) {
	var sel, range;
	if (selectionIsInMath()) {
		// IE9 and non-IE
		sel = window.getSelection();
		if (sel.getRangeAt && sel.rangeCount) {
			range = sel.getRangeAt(0);
			range.deleteContents();

			// Range.createContextualFragment() would be useful here but is
			// only relatively recently standardized and is not supported in
			// some browsers (IE9, for one)
			var el = document.createElement("div");
			el.innerHTML = html;
			var frag = document.createDocumentFragment(), node, lastNode;
			while ( (node = el.firstChild) ) {
				lastNode = frag.appendChild(node);
			}
			var firstNode = frag.firstChild;
			range.insertNode(frag);

			// Preserve the selection
			if (lastNode) {
				range = range.cloneRange();
				range.setStartAfter(lastNode);
				if (selectPastedContent) {
					range.setStartBefore(firstNode);
				} else {
					range.collapse(true);
				}
				sel.removeAllRanges();
				sel.addRange(range);
			}
			inputField.inputView.fire('input');
		}
	} else { // if selection is not in math input, just append it to the field
		document.querySelector('#math-input-field').textContent += html;
		inputField.inputView.fire('input');
	}
}

//check if selection is in input: if yes then
function selectionIsInMath() {
	return window.getSelection &&
		window.getSelection().anchorNode && ((
				window.getSelection().anchorNode.id &&
				window.getSelection().anchorNode.id === 'math-input-field')
			||
				(window.getSelection().anchorNode.parentNode &&
				window.getSelection().anchorNode.parentNode.id &&
				window.getSelection().anchorNode.parentNode.id === 'math-input-field'));
}

// ui wrapper
const shortcuts = (mathInput, mathView) => {
    previewField = mathView;
    inputField = mathInput;
    const list = new ListView();

    list.setTemplate({
        tag: 'div',
        attributes: {
            class: ['shortcuts-list'],
        },
        children: [
        {
            tag: 'div',
            attributes: {
                class: ['shortcuts-categories']
            },
            children: categories
        },
        renderCommands(activeCategory)
        ]
    });

    list.render();
    return list;
}



export default shortcuts;
