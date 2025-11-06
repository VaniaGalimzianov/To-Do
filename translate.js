import { langArr } from './lang.js';

const langSwitch = document.querySelector(".lang-switch");

langSwitch.addEventListener('click', function() {
    const lang = langSwitch.checked ? "en" : "ru";

    for (let key in langArr) {
        const elem = document.querySelector('.' + key);
        if (!elem) {
            console.log(`Элемент ${key} не найден`);
            continue;
        }

        // Если это input или textarea — меняем placeholder
        if (elem.tagName === "INPUT" || elem.tagName === "TEXTAREA") {
            elem.placeholder = langArr[key][lang];
        } else {
            // Очищаем содержимое и вставляем новый текст узлом
            while (elem.firstChild) {
                elem.removeChild(elem.firstChild);
            }
            elem.appendChild(document.createTextNode(langArr[key][lang]));
        }
    }
});
