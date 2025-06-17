//時計
function updateCurrentTime() {
    const currentTimeElement = document.getElementById('current-time');
    const currentTime = new Date().toLocaleString('ja-JP');
    currentTimeElement.textContent = currentTime;
  }
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);
//警報表示
const warn = new URLSearchParams(window.location.search);
if (warn.get("warn") === "eew") {
  document.getElementById('mainmode').style.display = "block";
  document.getElementById("warn").style.display = "block";
  document.getElementById("warnoff").style.display = "none";
}
//自動更新
const params = new URLSearchParams(window.location.search);
if (params.get("reload") === "on") {
  console.log('自動更新が有効です。60秒ごとに再読み込みします。');
  document.getElementById('mainmode').style.display = "block";
  document.getElementById("reloadoff").style.display = "none";
  document.getElementById("Status").style.display = "inline-block";
  setTimeout(function() {
      window.location.href = 'index.html?reload=on';
  }, 60 * 1000);
}
//地震情報表示
function eqis() {
  document.getElementById('btns').style.display = "block";
  document.getElementById('eqis').style.display = "none";
  document.getElementById('eqisnone').style.display = "block";
  document.getElementById('setting').style.display = "";
}
//地震情報非表示
function eqisnone() {
  document.getElementById('btns').style.display = "none";
  document.getElementById('eqis').style.display = "block";
  document.getElementById('eqisnone').style.display = "none";
  document.getElementById('setting').style.display = "";
}
//設定非表示
function exit() {
  document.getElementById('setting').style.display = "none";
  document.getElementById('shindo_icon').style.display = "";
}
//設定
document.addEventListener('contextmenu', () => {
  const setting = document.getElementById('setting');
  setting.style.display = 'block';
  document.getElementById('shindo_icon').style.display = "none";
});
function eqcommenton(){
  document.getElementById('eqcomment').style.display = "block";
  document.getElementById('eqcommenton').style.display = "none";
  document.getElementById('eqcommentoff').style.display = "block";
}
function commentoff() {
  document.getElementById('eqcomment').style.display = "none";
  document.getElementById('eqcommentoff').style.display = "none";
  document.getElementById('eqcommenton').style.display = "block";
}