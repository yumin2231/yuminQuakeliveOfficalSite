// P2P地震情報を取得
console.log("地震情報を取得中...")

// P2Pデータを処理する
fetchEarthquakeData();

function fetchEarthquakeData() {
    $.getJSON("https://api.p2pquake.net/v2/history?codes=551&limit=1", function(data) {
        // 地震情報の変換
        let maxInt_data = data[0]['earthquake']['maxScale'];
        var maxIntText = maxInt_data == 10 ? "1" : maxInt_data == 20 ? "2" : maxInt_data == 30 ? "3" : maxInt_data == 40 ? "4" :
                         maxInt_data == 45 ? "5弱" : maxInt_data == 46 ? "5弱" : maxInt_data == 50 ? "5強" : maxInt_data == 55 ? "6弱" :
                         maxInt_data == 60 ? "6強" : maxInt_data == 70 ? "7" : "不明";
        var Magnitude = data[0]['earthquake']['hypocenter']['magnitude'] != -1 ?
                        (data[0]['earthquake']['hypocenter']['magnitude']).toFixed(1) : 'ー.ー';
        var Name = data[0]['earthquake']['hypocenter']['name'] != "" ?
                   data[0]['earthquake']['hypocenter']['name'] : '';
        var Depth = data[0]['earthquake']['hypocenter']['depth'] != -1 ?
                    "約"+data[0]['earthquake']['hypocenter']['depth']+"km" : '不明';
        var tsunamiText = data[0]['earthquake']['domesticTsunami'] == "None" ? "この地震による津波の心配はありません。" :
                          data[0]['earthquake']['domesticTsunami'] == "Unknown" ? "不明" :
                          data[0]['earthquake']['domesticTsunami'] == "Checking" ? "津波に関しては現在気象庁で調査しています。" :
                          data[0]['earthquake']['domesticTsunami'] == "NonEffective" ? "この地震により、日本の沿岸では若干の海面変動があるかもしれませんが、被害の心配はありません。" :
                          data[0]['earthquake']['domesticTsunami'] == "Watch" ? "この地震で、津波注意報が発表されています。" :
                          data[0]['earthquake']['domesticTsunami'] == "Warning" ? "この地震で、津波警報または大津波警報が発表されています。今すぐ高いところ！　逃げて！\n A tsunami warning or a major tsunami warning has been issued for this earthquake. Get to higher ground now! Run! \n 此次地震已发布海啸警报或大海啸警报。快去高处！逃跑！ \n 這次地震發出了海嘯警報或大海嘯警報。快去高處！逃跑！ \n 이번 지진으로 쓰나미 경고 또는 대쓰나미 경고가 발표되었습니다. 지금 바로 높은 곳으로! 도망쳐!" : "";
        var Time = data[0]['earthquake']['time'];

        // 震度情報の処理
        var points = data[0].points;
        
        // 震度ごとにグループ化
        var scalePoints = {};
        points.forEach(function(point) {
            const scaleText = point.scale == 10 ? "1" :
                            point.scale == 20 ? "2" :
                            point.scale == 30 ? "3" :
                            point.scale == 40 ? "4" :
                            point.scale == 45 ? "5弱" :
                            point.scale == 50 ? "5強" :
                            point.scale == 55 ? "6弱" :
                            point.scale == 60 ? "6強" :
                            point.scale == 70 ? "7" : "不明";

            if (!scalePoints[scaleText]) {
                scalePoints[scaleText] = {};
            }
            if (!scalePoints[scaleText][point.pref]) {
                scalePoints[scaleText][point.pref] = new Set();
            }
            scalePoints[scaleText][point.pref].add(point.addr);
        });

        // 震度情報のテキスト作成
        var scaleOrder = ["7", "6強", "6弱", "5強", "5弱", "4", "3", "2", "1"];
        var pointsInfo = "";
        var hasPoints = false;

        scaleOrder.forEach(function(scale) {
            if (scalePoints[scale]) {
                hasPoints = true;
                pointsInfo += `\n震度${scale}\n`;
                Object.keys(scalePoints[scale]).sort().forEach(function(pref) {
                    if (scalePoints[scale][pref].size > 0) {
                        pointsInfo += pref + " " + Array.from(scalePoints[scale][pref]).sort().join('、') + "\n";
                    }
                });
            }
        });

        // 震度情報がある場合のみ、ヘッダーを追加
        if (hasPoints) {
            pointsInfo = "\n\n各地の震度は以下の通りです。" + pointsInfo;
        }

        // 最終的な情報テキストの作成
        var info = "地震についての情報です。\n" +
                   Time + "頃、" + Name + "で最大震度" + maxIntText + "の地震がありました。\n" +tsunamiText +"\n震源の深さは" + Depth + "、地震の規模を示すマグニチュードは" + Magnitude + "と推定されています。" + pointsInfo;

        // コメントがある場合は追加し、※印の説明も表示
        if (data[0].comments && data[0].comments.freeFormComment) {
            info += "\n\n※　" + data[0].comments.freeFormComment;
        }

        document.getElementById('eqinfo').innerText = info;
        console.log("地震情報取得完了。");
    });
}

// 50sカウントしたらDevToolに再読み込みを促す
setTimeout(function(){
    console.log("50秒が経過しました。\n情報を更新するためにまもなく再読込します。");
}, 50*1000);

// 60sたったら自動的に再読み込みする
setTimeout(function(){
    window.location.href = 'index.html';
}, 60*1000);

// コピーボタンの処理
document.getElementById('copy_btn').addEventListener('click', function() {
    const textDiv = document.getElementById('eqinfo');
    const textToCopy = textDiv.innerText;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('地震情報をクリップボードにコピーしました。');
    }).catch(err => {
        alert('クリップボードにコピーできませんでした。:' + err);
    });
});