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