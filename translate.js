import { langArr } from './lang.js';


const langSwitch = document.querySelector(".lang-switch");

langSwitch.addEventListener('click', function() {

    if (langSwitch.checked) {
        for (let key in langArr) {
            try {
                document.querySelector('.' +  key).innerHTML = langArr[key]["ru"];
            } catch {
                console.log(`Элемент ${key} не найден`);
            }
        }
    } else {
        for (let key in langArr) {
            try {
                document.querySelector('.' +  key).innerHTML = langArr[key]["en"];
            } catch {
                console.log(`Элемент ${key} не найден`);
            }
        }
    }
});