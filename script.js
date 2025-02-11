const responsive_menu_btn = document.querySelector('.responsive_btn');
responsive_menu_btn.addEventListener('click', menuToggle);

function menuToggle() {
const header_menu_detail = document.querySelector('.header_nav');
header_menu_detail.classList.toggle('menu_active');
}

function DeleteArc(url,message){
    if(confirm(message)){
        location.href = url;
    }
}

(function() {
    const params = new URLSearchParams(window.location.search);
    const hideDivId = params.get('loading'); // "hide"パラメーターを取得

    if (hideDivId) {
        const element = document.getElementById(hideDivId);
        if (element) {
            element.style.display = 'none'; // 直接display: none;を適用
        }
    }
})();