// P2P地震情報を取得
console.log("地震情報を取得中...")

// 観測点情報を読み込む
let stations = {};
// stations.jsonを先に読み込んでから、P2Pデータを処理する
$.getJSON("stations.json", function(stationsData) {
    // 観測点情報をマッピング（市町村名をキーにする）
    stationsData.forEach(station => {
        const cityName = station.city.name;  // 市町村名をキーにする
        if (!stations[cityName]) {
            stations[cityName] = {
                pref: station.pref.name
            };
        }
    });

    // stations.jsonの読み込みが完了してからP2Pデータを取得
    fetchEarthquakeData();
});

function extractCityName(addr) {
    // 市区町村名を抽出する関数
    const cityMatch = addr.match(/^([^市区町村]+?[市区町村])/);
    if (cityMatch) {
        return cityMatch[1];
    }
    return addr;  // マッチしない場合は元の名前を返す
}

function fetchEarthquakeData() {
    $.getJSON("https://api.p2pquake.net/v2/history?codes=551&limit=1", function(data) {
        try {
            // データの存在確認
            if (!data || !data[0] || !data[0]['earthquake']) {
                console.error('Invalid data format:', data);
                return;
            }
            // 地震情報の変換
            let maxInt_data = data[0]['earthquake']['maxScale'];
            var maxIntText = maxInt_data == 10 ? "1" : maxInt_data == 20 ? "2" : maxInt_data == 30 ? "3" : maxInt_data == 40 ? "4" :
                             maxInt_data == 45 ? "5弱" : maxInt_data == 46 ? "5弱" : maxInt_data == 50 ? "5強" : maxInt_data == 55 ? "6弱" :
                             maxInt_data == 60 ? "6強" : maxInt_data == 70 ? "7" : "不明";
            var Magnitude = data[0]['earthquake']['hypocenter']['magnitude'] != -1 ?
                            (data[0]['earthquake']['hypocenter']['magnitude']).toFixed(1) : 'ー.ー';
            var Name = data[0]['earthquake']['hypocenter']['name'] != "" ?
                       data[0]['earthquake']['hypocenter']['name'] : '';
            
            var tsunamiText = data[0]['earthquake']['domesticTsunami'] == "None" ? "この地震による津波の心配はありません。" :
                              data[0]['earthquake']['domesticTsunami'] == "Unknown" ? "不明" :
                              data[0]['earthquake']['domesticTsunami'] == "Checking" ? "津波に関しては現在気象庁で調査しています。" :
                              data[0]['earthquake']['domesticTsunami'] == "NonEffective" ? "この地震により、日本の沿岸では若干の海面変動があるかもしれませんが、被害の心配はありません。" :
                              data[0]['earthquake']['domesticTsunami'] == "Watch" ? "この地震で、津波注意報が発表されています。" :
                              data[0]['earthquake']['domesticTsunami'] == "Warning" ? "この地震で、津波警報または大津波警報が発表されています。今すぐ高いところ！　逃げて！\n A tsunami warning or a major tsunami warning has been issued for this earthquake. Get to higher ground now! Run! \n 此次地震已发布海啸警报或大海啸警报。快去高处！逃跑！ \n 這次地震發出了海嘯警報或大海嘯警報。快去高處！逃跑！ \n 이번 지진으로 쓰나미 경고 또는 대쓰나미 경고가 발표되었습니다. 지금 바로 높은 곳으로! 도망쳐!" : "";
            var Time = data[0]['earthquake']['time'];
            // 複数の都道府県に対応するための修正
            var Prefls;
        if (Name) {
            Prefls = Name ;
        } else {
            var maxScaleAddrs = data[0].points.filter(point => {
                const scaleText = point.scale == 10 ? "1" :
                                  point.scale == 20 ? "2" :
                                  point.scale == 30 ? "3" :
                                  point.scale == 40 ? "4" :
                                  point.scale == 45 ? "5弱" :
                                  point.scale == 50 ? "5強" :
                                  point.scale == 55 ? "6弱" :
                                  point.scale == 60 ? "6強" :
                                  point.scale == 70 ? "7" : "不明";
                return scaleText === maxIntText;
            }).map(point => point.addr);
            Prefls = [...new Set(maxScaleAddrs)].join('、') + '付近';
        }

            // 震度情報の処理
            var points = data[0].points;

        // 市町村ごとの最大震度を記録
        var cityMaxScale = {};
            points.forEach(function(point) {
            // P2Pの観測点名から市町村名を抽出
            const cityName = extractCityName(point.addr);
            
            // その市町村の情報がstations.jsonにあるか確認
            if (stations[cityName]) {
                const cityKey = `${stations[cityName].pref}${cityName}`;
                const currentScale = point.scale;
                
                // その市町村の既存データを確認し、より大きい震度があれば更新
                if (!cityMaxScale[cityKey] || currentScale > cityMaxScale[cityKey].scale) {
                    cityMaxScale[cityKey] = {
                        pref: stations[cityName].pref,
                        city: cityName,
                        scale: currentScale
                    };
                }
            }
        });
            
            // 震度ごとにグループ化
            var scalePoints = {};
            Object.values(cityMaxScale).forEach(function(cityInfo) {
                const scaleText = cityInfo.scale == 10 ? "1" :
                                 cityInfo.scale == 20 ? "2" :
                                 cityInfo.scale == 30 ? "3" :
                                 cityInfo.scale == 40 ? "4" :
                                 cityInfo.scale == 45 ? "5弱" :
                                 cityInfo.scale == 50 ? "5強" :
                                 cityInfo.scale == 55 ? "6弱" :
                                 cityInfo.scale == 60 ? "6強" :
                                 cityInfo.scale == 70 ? "7" : "不明";

                if (!scalePoints[scaleText]) {
                    scalePoints[scaleText] = {};
                }
                if (!scalePoints[scaleText][cityInfo.pref]) {
                    scalePoints[scaleText][cityInfo.pref] = new Set();
                }
    
                scalePoints[scaleText][cityInfo.pref].add(cityInfo.city);
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

            var depth = data[0]['earthquake']['hypocenter']['depth'];
            var classification;
            if (depth === 0) {
                classification = 'shallow';
            } else if (depth === -1) {
                classification = '不明';
            } else if (depth < 70) {
                classification = 'shallow';
            } else if (depth < 300) {
                classification = 'intermediate';
            } else {
                classification = 'deep';
            }

            function generateEarthquakeMessage(depth, magnitude, classification) {
                if (depth === -1 || magnitude === 'ー.ー') {
                    return '震源及びマグニチュードは現在気象庁で精査中です';
                }
                const depthMessage = depth === 0 ? '浅い' : `${depth} km`;
                return `震源の深さは${depthMessage}、地震の規模を示すマグニチュードは${magnitude}と推定されています。`;
            }
    
            // 最終的な情報テキストの作成
            var info = "地震についての情報です。\n" +
                       Time + "頃、" + Prefls + "で最大震度" + maxIntText + "の地震がありました。\n" + tsunamiText + "\n\n" + generateEarthquakeMessage(depth, Magnitude, classification) + pointsInfo;

                       // コメントがある場合は追加し、※印の説明も表示
            if (data[0].comments && data[0].comments.freeFormComment) {
                info += "\n\n※　" + data[0].comments.freeFormComment;
            }

            document.getElementById('eqinfo').innerText = info;
            console.log("地震情報取得完了。");
        } catch (error) {
            console.error('Error processing earthquake data:', error);
        }
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