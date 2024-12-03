//このスクリプトを読み込んだらDevToolに取得中と表示
console.log("USGS地震情報を取得中...")

// USGS APIから地震情報を取得
// 過去1日間のM4.5以上の地震を取得
$.getJSON("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson", function(data) {
    if (data.features && data.features.length > 0) {
        // 最新の地震情報を取得
        const earthquake = data.features[0];
        const properties = earthquake.properties;
        
        // 地震情報の変換
        const magnitude = properties.mag.toFixed(1);
        const place = properties.place || '場所不明';
        const time = new Date(properties.time).toLocaleString('ja-JP');
        const depth = earthquake.geometry.coordinates[2].toFixed(1); // 深さはgeometry.coordinates[2]から取得
        const tsunamiAlert = properties.tsunami === 1 ? "津波の可能性があります。" : "この地震による津波の心配はありません。";
        
        // 情報テキストの作成
        const info = `地震についての情報です。\n${time}頃、${place}で地震がありました。\n` +
                    `マグニチュード: ${magnitude}\n` +
                    `震源の深さ: ${depth}km\n` +
                    `${tsunamiAlert}`;
        
        document.getElementById('eqinfo').innerText = info;
    } else {
        document.getElementById('eqinfo').innerText = "最近の大きな地震情報はありません。";
    }
}).fail(function(jqXHR, textStatus, errorThrown) {
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