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

$(function () {
    $(document).ready(function () {
        $('.banner-close').click(function() {
            $(this).parent().hide();
        });
    });
});