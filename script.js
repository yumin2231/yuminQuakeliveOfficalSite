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
let text = '2025';
let cr = document.getElementById('cr');
  cr.innerHTML = text; 