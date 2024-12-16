//このスクリプトを読み込んだらDevToolに取得中と表示
console.log("地震情報を取得中...")

//地震情報
$.getJSON("https://api.p2pquake.net/v2/history?codes=551&limit=1", function(data) {
    //地震情報の変換
    let maxInt_data = data[0]['earthquake']['maxScale'];
    var maxIntText = maxInt_data == 10 ? "1" : maxInt_data == 20 ? "2" : maxInt_data == 30 ? "3" : maxInt_data == 40 ? "4" :
                     maxInt_data == 45 ? "5弱" : maxInt_data == 46 ? "5弱" : maxInt_data == 50 ? "5強" : maxInt_data == 55 ? "6弱" :
                     maxInt_data == 60 ? "6強" : maxInt_data == 70 ? "7" : "不明";
    
    var Magnitude = data[0]['earthquake']['hypocenter']['magnitude'] != -1 ?
                    (data[0]['earthquake']['hypocenter']['magnitude']).toFixed(1) : 'ー.ー';
    var Name = data[0]['earthquake']['hypocenter']['name'] != "" ?
               data[0]['earthquake']['hypocenter']['name'] : '情報なし';
    var Depth = data[0]['earthquake']['hypocenter']['depth'] != -1 ?
                "約"+data[0]['earthquake']['hypocenter']['depth']+"km" : '不明';
    var tsunamiText = data[0]['earthquake']['domesticTsunami'] == "None" ? "この地震による津波の心配はありません。" :
                      data[0]['earthquake']['domesticTsunami'] == "Unknown" ? "不明" :
                      data[0]['earthquake']['domesticTsunami'] == "Checking" ? "津波に関しては現在気象庁で調査しています。" :
                      data[0]['earthquake']['domesticTsunami'] == "NonEffective" ? "この地震について、若干の海面変動・津波予報が発表中されていますが、津波被害の心配はありません。" :
                      data[0]['earthquake']['domesticTsunami'] == "Watch" ? "この地震について、津波注意報が発表されています。" :
                      data[0]['earthquake']['domesticTsunami'] == "Warning" ? "この地震で、津波警報または大津波警報が発表されています。今すぐ高いところ！　逃げて！\n A tsunami warning or a major tsunami warning has been issued for this earthquake. Get to higher ground now! Run! \n 此次地震已发布海啸警报或大海啸警报。快去高处！逃跑！ \n 這次地震發出了海嘯警報或大海嘯警報。快去高處！逃跑！ \n 이번 지진으로 쓰나미 경고 또는 대쓰나미 경고가 발표되었습니다. 지금 바로 높은 곳으로! 도망쳐!" : "情報なし";
    var Time = data[0]['issue']['time'];
    var Pref = data[0]['points']['0']['pref'];
    
    document.getElementById('eqinfo').innerText = info;
    
    var info = "地震についての情報です。\n"+Time+"頃、"+Pref+"付近で最大震度"+maxIntText+"を観測する地震がありました。\n震源地は"+Name+"で、震源の深さは"+Depth+"、地震の規模を示すマグニチュードは"+Magnitude+"とされています。\n"+tsunamiText+""
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

    document.getElementById('copy_btn').addEventListener('click', function() {
        const textDiv = document.getElementById('eqinfo');
        const textToCopy = textDiv.innerText; // 改行を保持したテキストを取得

        // テキストをクリップボードにコピー
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('地震情報をクリップボードにコピーしました。');
        }).catch(err => {
            alert('クリップボードにコピーできませんでした。:' + err);
        });
    });