console.log("台湾中央気象署の地震情報を取得中...");

// 台湾中央気象署の2つのAPIから地震情報を取得
const api1 = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0016-002?Authorization=CWA-5213FEEE-BE00-4113-95C2-E178BDE98FF2&format=JSON";
const api2 = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0015-002?Authorization=CWA-5213FEEE-BE00-4113-95C2-E178BDE98FF2&format=JSON";

Promise.all([
    $.getJSON(api1),
    $.getJSON(api2)
])
.then(function([data1, data2]) {
    console.log("受信データ1:", data1); // デバッグ用
    console.log("受信データ2:", data2); // デバッグ用
    
    let earthquakes = [];
    
    // 地震報告のデータを追加
    if (data1.success === "true" && data1.records && data1.records.Earthquake && data1.records.Earthquake.length > 0) {
        const eq = data1.records.Earthquake[0];
        // 最大震度を取得する関数
        const getMaxIntensity = (intensity) => {
            if (!intensity || !intensity.ShakingArea) return "不明";
            let maxIntensity = "0";
            intensity.ShakingArea.forEach(area => {
                if (area.AreaIntensity && parseInt(area.AreaIntensity) > parseInt(maxIntensity)) {
                    maxIntensity = area.AreaIntensity;
                }
            });
            return maxIntensity === "0" ? "不明" : maxIntensity;
        };

        earthquakes.push({
            type: "地震報告",
            time: new Date(eq.EarthquakeInfo.OriginTime),
            info: `【地震報告】\n` +
                  `発生時刻: ${eq.EarthquakeInfo.OriginTime}\n` +
                  `震央地名: ${eq.EarthquakeInfo.Epicenter.Location}\n` +
                  `マグニチュード: ${eq.EarthquakeInfo.EarthquakeMagnitude.MagnitudeValue}\n` +
                  `深さ: ${eq.EarthquakeInfo.FocalDepth}km\n` +
                  `最大震度: ${getMaxIntensity(eq.Intensity)}`
        });
    }
    
    // 地震速報のデータを追加
    if (data2.success === "true" && data2.records && data2.records.Earthquake && data2.records.Earthquake.length > 0) {
        const eq = data2.records.Earthquake[0];
        // 最大震度を取得する関数
        const getMaxIntensity = (intensity) => {
            if (!intensity || !intensity.ShakingArea) return "不明";
            let maxIntensity = "0";
            intensity.ShakingArea.forEach(area => {
                if (area.AreaIntensity && parseInt(area.AreaIntensity) > parseInt(maxIntensity)) {
                    maxIntensity = area.AreaIntensity;
                }
            });
            return maxIntensity === "0" ? "不明" : maxIntensity;
        };

        earthquakes.push({
            type: "地震速報",
            time: new Date(eq.EarthquakeInfo.OriginTime),
            info: `【地震速報】\n` +
                  `発生時刻: ${eq.EarthquakeInfo.OriginTime}\n` +
                  `震央地名: ${eq.EarthquakeInfo.Epicenter.Location}\n` +
                  `マグニチュード: ${eq.EarthquakeInfo.EarthquakeMagnitude.MagnitudeValue}\n` +
                  `深さ: ${eq.EarthquakeInfo.FocalDepth}km\n` +
                  `最大震度: ${getMaxIntensity(eq.Intensity)}`
        });
    }
    
    // 時間でソートし、最新の情報を表示
    if (earthquakes.length > 0) {
        earthquakes.sort((a, b) => b.time - a.time);
        document.getElementById('eqinfo').innerText = earthquakes[0].info;
    } else {
        document.getElementById('eqinfo').innerText = "最近の地震情報はありません。";
    }
})
.fail(function(jqXHR, textStatus, errorThrown) {
    console.error("地震情報の取得に失敗しました:", textStatus, errorThrown);
    document.getElementById('eqinfo').innerText = "地震情報の取得に失敗しました。";
});

//地震情報が受信できたらDevToolに取得完了と表示する
console.log("地震情報取得完了。")

//地震情報を受信して2秒後DevToolに待機状態と表示する
setTimeout(function(){
    console.log("待機モードに入ります。")
}, 2*1000)

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