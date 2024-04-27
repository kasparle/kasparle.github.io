var loader = document.getElementById('loader'),
    load = document.getElementById('loading'),
    myTime,
    newTime = 0;

function loading() {
    'use strict';

    newTime = newTime + 1;

    if (newTime > 100) {
        newTime = 0;
        // load.style.transition = '1s all';
        // load.style.opacity = '0';
        // clearInterval(myTime);
    } else {
        loader.textContent = newTime + "%";
    }
}

myTime = setInterval(loading, 200);