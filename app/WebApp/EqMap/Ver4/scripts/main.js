//時計
function updateCurrentTime() {
    const currentTimeElement = document.getElementById('current-time');
    const currentTime = new Date().toLocaleString('ja-JP');
    currentTimeElement.textContent = currentTime;
  }
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

//右クリックメニュー
(function(){
  const myContextMenu = document.getElementById('js-contextmenu');

  document.body.addEventListener('contextmenu', e => {
    const posX = e.pageX;
    const posY = e.pageY;
    myContextMenu.style.left = posX+'px';
    myContextMenu.style.top = posY+'px';
    myContextMenu.classList.add('show');
  });
  document.body.addEventListener('click', () => {
    if(myContextMenu.classList.contains('show')) {
      myContextMenu.classList.remove('show');
    }
  })
}());
//警報表示
    function getQueryParam(param) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(param);
    }
    window.onload = function() {
      const warn = getQueryParam('warn');
      const titleElement = document.getElementById('warn');
      if (warn === 'eew') {
        titleElement.style.display = 'block'; // 表示
      } else {
        titleElement.style.display = 'none'; // 非表示
      }
    };

//リロード
const params = new URLSearchParams(window.location.search);
        
if (params.get("reload") === "on") {
  setTimeout(function() {
      console.log('自動更新が有効です。60秒ごとに再読み込みします。');
      window.location.href = 'index.html?reload=on';
  }, 60 * 1000);
}