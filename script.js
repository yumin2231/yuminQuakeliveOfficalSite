(function ensureViewport(){
  var vp = document.querySelector('meta[name="viewport"]');
  if(!vp){
    var m = document.createElement('meta');
    m.name = 'viewport';
    m.content = 'width=device-width, initial-scale=1.0';
    document.head.appendChild(m);
  }
})();

const responsive_menu_btn = document.querySelector('.responsive_btn');
if (responsive_menu_btn) {
  responsive_menu_btn.addEventListener('click', menuToggle);
}

function menuToggle() {
const header_menu_detail = document.querySelector('.header_nav');
if (header_menu_detail) {
  header_menu_detail.classList.toggle('menu_active');
}
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

// 追加: デスクトップのドロップダウンをクリックで開閉し、開いたまま維持
(function initDesktopDropdown(){
  const dropdown = document.querySelector('.header-nav .dropdown');
  if(!dropdown) return;
  const toggle = dropdown.querySelector('.dropdown-toggle');
  const menu = dropdown.querySelector('.dropdown-menu');
  if(!toggle || !menu) return;

  // 開閉トグル
  toggle.addEventListener('click', function(e){
    e.preventDefault();
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  // メニュー内クリックでは閉じない
  menu.addEventListener('click', function(e){
    e.stopPropagation();
  });

  // 外側クリックで閉じる
  document.addEventListener('click', function(){
    dropdown.classList.remove('open');
  });

  // ESCキーで閉じる（アクセシビリティ）
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      dropdown.classList.remove('open');
    }
  });
})();