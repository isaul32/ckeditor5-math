import { ListView } from '@ckeditor/ckeditor5-ui';
import View from '@ckeditor/ckeditor5-ui/src/view';
import { groupBy } from 'lodash';
import svgIcons from '../../assets/math-shortcut-icons';

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

    p.onclick = () => {
        activeCategory = p.innerText;
        document.querySelector('.active')?.classList.remove('active');
        p.classList.add('active');

        renderCommands(activeCategory);
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
            document.querySelector('#math-input-field').textContent += command.element.id;
            inputField.inputView.fire('input');

            renderCommands(activeCategory);
        }

        li.appendChild(command.element);
        ul.appendChild(li);
    }

    return ul;
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
