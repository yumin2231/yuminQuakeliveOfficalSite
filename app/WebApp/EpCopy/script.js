//アクセスカウントログ
console.log("地震情報を取得中...")
//地震情報
$.getJSON("https://api.p2pquake.net/v2/history?codes=551&limit=1", function(data) {
    var hypocenter = data[0]["earthquake"]["hypocenter"];
    var info = "地震についての情報です。\n"+data[0]["earthquake"]["time"]+"頃、〇〇地方で最大震度"+data[0]["earthquake"]["maxScale"] / 10+"を観測する地震がありました。\n震源地は"+hypocenter["name"]+"で、震源の深さは"+hypocenter["depth"]+"km、地震の規模を示すマグニチュードは"+hypocenter["magnitude"]+"とされています。\n";
    document.getElementById('eqinfo').innerText = info;
    console.log("地震情報取得完了。")
    //2秒カウントログ
    setTimeout(function(){
        console.log("待機モードに入ります。")
    }, 2*1000)
});
//50秒カウントログ
setTimeout(function(){
    console.log("50秒が経過しました。\n情報を更新するためにまもなく再読込します。")
}, 50*1000)
//自動再読み込み
setTimeout(function(){
    window.location.href = 'index.html';
}, 60*1000);