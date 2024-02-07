//このスクリプトを読み込んだらDevToolに取得中と表示
console.log("地震情報を取得中...")

//地震情報
$.getJSON("https://api.p2pquake.net/v2/history?codes=551&limit=1", function(data) {
    var hypocenter = data[0]["earthquake"]["hypocenter"];
    var info = "地震についての情報です。\n"+data[0]["earthquake"]["time"]+"頃、〇〇地方で最大震度"+data[0]["earthquake"]["maxScale"] / 10+"を観測する地震がありました。\n震源地は"+hypocenter["name"]+"で、震源の深さは"+hypocenter["depth"]+"km、地震の規模を示すマグニチュードは"+hypocenter["magnitude"]+"とされています。\n"+["tsunami"];
    document.getElementById('eqinfo').innerText = info;
    
    //地震情報が受信できたらDevToolに取得完了と表示する
    console.log("地震情報取得完了。")

    //地震情報を受信して2秒後DevToolに待機状態と表示する
    setTimeout(function(){
        console.log("待機モードに入ります。")
    }, 2*1000)

});

    //50秒カウントしたらDelToolに再読み込みを促す
    setTimeout(function(){
        console.log("50秒が経過しました。\n情報を更新するためにまもなく再読込します。")
    }, 50*1000)

    //1分たったら自動的に再読み込みする
    setTimeout(function(){
        window.location.href = 'index.html';
    }, 60*1000);