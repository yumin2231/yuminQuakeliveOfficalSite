// adding features by akki
var QuakeJson;
var JMAPointsJson;
var countries_data;
var japan_data;
var world_data;

// 1. MapLibreのマップ初期化
var map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        sources: {},
        layers: []
    },
    center: [137.984, 36.575],
    zoom: 5,
    minZoom: 2,
    maxZoom: 10,
    
    // 【修正箇所】ここを明示的に設定します
    dragRotate: false,       // マウスでのドラッグ回転を禁止
    touchZoomRotate: true,   // ピンチズームは許可するが…
    pitchWithRotate: false   // 回転と傾斜を無効化
});

// さらに、念押しで以下のコードを初期化直後に追加してください
map.touchZoomRotate.disableRotation();

var PolygonLayer_Style_nerv = {
    "color": "#ffffff",
    "weight": 1.5,
    "fillColor": "#3a3a3a",
};

// 地震情報リストをクリックしたときの発火イベント
var list = document.getElementById('quakelist');
list.onchange = event => {
    Cookies.set("listSelectedIndex", list.selectedIndex);
    QuakeSelect(list.selectedIndex);
}

document.getElementById('reload').addEventListener("click", () => {
    let reloadNum = document.getElementById('reload_num').value;
    if (reloadNum != "") {
        if (reloadNum > 100 || reloadNum <= 0) {
            reloadData(100)
        } else {
            reloadData(reloadNum);
        }
    } else {
        reloadData();
    }
    document.getElementById('reload').innerText = "更新中…";
});

var koushin_ok;
async function reloadData(reloadOption) {
    clearTimeout(koushin_ok);
    await GetQuake(reloadOption);
    await QuakeSelect(Cookies.get("listSelectedIndex"));
    document.getElementById('reload').innerText = "更新完了";
    koushin_ok = setTimeout(() => {
        document.getElementById('reload').innerText = "情報更新";
    }, 1000);
}

// 【★ここを修正★】ロードが速すぎた場合のすっぽ抜け防止
const mapLoaded = new Promise(resolve => {
    if (map.loaded()) {
        resolve();
    } else {
        map.once('load', resolve);
    }
});

const pointPopup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 15,
    maxWidth: 'none'
});

// メインの初期化処理
(async () => {
    try {
        document.getElementById('status').innerHTML = "地図データの読み込み中...";
        
        await Promise.all([
            mapLoaded, 
            GetJson(),
            GetSaibunData(), 
            GetQuake()
        ]);
        
        await loadShindoIcons();
        
        setupBaseMapLayers();
        setupFillLayer();
        setupPointLayer();

        Cookies.set("listSelectedIndex", 0);
        QuakeSelect(0);
        
        document.getElementById('loading').style.display = "none";
    } catch (error) {
        console.error("初期化エラー:", error);
        document.getElementById('status').innerHTML = "エラーが発生しました。コンソールを確認してください。";
    }
})();

// WebP形式の震度アイコンをMapLibreに事前登録する関数（ネイティブImage版）
function loadShindoIcons() {
    const iconThemes = [
        { scale: 10, file: 'jqk_int1.webp' },
        { scale: 20, file: 'jqk_int2.webp' },
        { scale: 30, file: 'jqk_int3.webp' },
        { scale: 40, file: 'jqk_int4.webp' },
        { scale: 45, file: 'jqk_int50.webp' },
        { scale: 46, file: 'jqk_int_.webp' },
        { scale: 50, file: 'jqk_int55.webp' },
        { scale: 55, file: 'jqk_int60.webp' },
        { scale: 60, file: 'jqk_int65.webp' },
        { scale: 70, file: 'jqk_int7.webp' },
        { scale: 99, file: 'jqk_int_.webp' } // 不明・その他のフォールバック用
    ];

    // すべての画像の読み込みをPromiseで管理する
    const promises = iconThemes.map(icon => {
        return new Promise((resolve) => {
            // MapLibreの機能を使わず、ブラウザ標準のImageオブジェクトを使う
            const img = new Image();
            
            // 読み込み成功時の処理
            img.onload = () => {
                // MapLibreに直接画像データをねじ込む
                if (!map.hasImage(`shindo-${icon.scale}`)) {
                    map.addImage(`shindo-${icon.scale}`, img); 
                }
                resolve();
            };

            // 読み込み失敗（404等）時の処理
            img.onerror = () => {
                console.warn(`画像が見つかりません: source/${icon.file}`);
                resolve(); // 止まらないように次へ進める
            };

            // 読み込み開始
            img.src = `source/${icon.file}`;
        });
    });

    return Promise.all(promises);
}

// ベースマップ構築
function setupBaseMapLayers() {
    map.addSource('world', { type: 'geojson', data: world_data });
    map.addLayer({
        id: 'world-fill', type: 'fill', source: 'world',
        paint: { 'fill-color': PolygonLayer_Style_nerv.fillColor, 'fill-opacity': 1 }
    });
    map.addLayer({
        id: 'world-line', type: 'line', source: 'world',
        paint: { 'line-color': PolygonLayer_Style_nerv.color, 'line-width': PolygonLayer_Style_nerv.weight }
    });

    map.addSource('japan', { type: 'geojson', data: japan_data });
    map.addLayer({
        id: 'japan-fill', type: 'fill', source: 'japan',
        paint: { 'fill-color': PolygonLayer_Style_nerv.fillColor, 'fill-opacity': 1 }
    });
    map.addLayer({
        id: 'japan-line', type: 'line', source: 'japan',
        paint: { 'line-color': PolygonLayer_Style_nerv.color, 'line-width': PolygonLayer_Style_nerv.weight }
    });

    if (countries_data) {
        map.addSource('countries', { type: 'geojson', data: countries_data });
        map.addLayer({ id: 'countries-fill', type: 'fill', source: 'countries', paint: { 'fill-color': '#3a3a3a' }});
        map.addLayer({ id: 'countries-line', type: 'line', source: 'countries', paint: { 'line-color': '#ffffff', 'line-width': 1.5 }});
    }
}

// 塗りつぶしエリア構築
function setupFillLayer() {
    map.addSource('filled-areas', { 
        type: 'geojson', 
        data: { type: 'FeatureCollection', features: [] } 
    });
    map.addLayer({
        id: 'filled-areas-fill', type: 'fill', source: 'filled-areas',
        paint: { 'fill-color': ['get', 'fillColor'], 'fill-opacity': 1 }
    });
    map.addLayer({
        id: 'filled-areas-line', type: 'line', source: 'filled-areas',
        paint: { 'line-color': '#ffffff', 'line-width': 1.2 }
    });
}

// 震度アイコン構築
function setupPointLayer() {
    map.addSource('shindo-points', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
    });

    map.addLayer({
        id: 'shindo-icons',
        type: 'symbol',
        source: 'shindo-points',
        layout: {
            'icon-image': ['get', 'icon'], 
            'icon-size': 0.04, 
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'symbol-sort-key': ['get', 'sortKey']   // ← 追加
        }
    });

    map.on('mouseenter', 'shindo-icons', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const props = e.features[0].properties;
        const coordinates = e.features[0].geometry.coordinates.slice();
        
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        
        const html = `<ruby>${props.name}<rt style="font-size: 0.7em;">${props.furigana}</rt></ruby> ${props.shindoText}`;
        pointPopup.setLngLat(coordinates).setHTML(html).addTo(map);
    });

    map.on('mouseleave', 'shindo-icons', () => {
        map.getCanvas().style.cursor = '';
        pointPopup.remove();
    });
}

// データフェッチ群
async function GetSaibunData() {
    const [saibunResponse, worldResponse] = await Promise.all([
        fetch("source/saibun.geojson"),
        fetch("source/World.geojson")
    ]);
    japan_data = await saibunResponse.json();
    world_data = await worldResponse.json();
}

async function GetJson() {
    const response = await fetch("source/JMAstations.json");
    JMAPointsJson = await response.json();
}

async function GetQuake(option) {
    document.getElementById('status').innerHTML = "地震情報読み込み中...";
    var url = !isNaN(option) ? 
        "https://api.p2pquake.net/v2/history?codes=551&limit=" + option : 
        "https://api.p2pquake.net/v2/history?codes=551&limit=20";
    
    const response = await fetch(url);
    QuakeJson = await response.json();

    while (document.getElementById('quakelist').lastChild) {
        document.getElementById('quakelist').removeChild(document.getElementById('quakelist').lastChild);
    }

    var forEachNum = 0;
    QuakeJson.forEach(element => {
        var option = document.createElement("option");
        var text;
        let maxInt_data = element['earthquake']['maxScale'];
        let maxIntText = hantei_maxIntText(maxInt_data);
        let Name = hantei_Name(element['earthquake']['hypocenter']['name']);
        let Time = element['earthquake']['time'];

        if (element["issue"]["type"] == "ScalePrompt") {
            text = "【震度速報】" + element["points"][0]["addr"] + "など\n" + Time.slice(0, -3) + "\n最大震度 : " + maxIntText;
        } else if (element["issue"]["type"] == "Destination") {
            text = "【震源情報】" + Time.slice(0, -3) + " " + Name;
        } else if (element["issue"]["type"] == "Foreign") {
            text = "【遠地地震】" + Time.slice(0, -3) + " " + Name;
        } else {
            text = Time.slice(0, -3) + " " + Name + "\n\n最大震度 : " + maxIntText;
        }
        option.value = "" + forEachNum + "";
        option.textContent = text;
        document.getElementById('quakelist').appendChild(option);
        forEachNum++;
    });
}

var currentMarkers = []; 
var filled_list = {};

async function QuakeSelect(num) {
    list.options[Cookies.get("listSelectedIndex")].selected = true;

    currentMarkers.forEach(marker => marker.remove());
    currentMarkers = [];
    filled_list = {};
    if(map.getSource('filled-areas')) map.getSource('filled-areas').setData({ type: 'FeatureCollection', features: [] });
    if(map.getSource('shindo-points')) map.getSource('shindo-points').setData({ type: 'FeatureCollection', features: [] });
    pointPopup.remove();

    let eq = QuakeJson[num];
    let maxIntText = hantei_maxIntText(eq['earthquake']['maxScale']);
    let Magnitude = hantei_Magnitude(eq['earthquake']['hypocenter']['magnitude']);
    let Name = hantei_Name(eq['earthquake']['hypocenter']['name']);
    let Depth = hantei_Depth(eq['earthquake']['hypocenter']['depth']);
    let tsunamiText = hantei_tsunamiText(eq['earthquake']['domesticTsunami']);
    let tsunamiTextabroad = hantei_tsunamiText_abroad(eq['earthquake']['foreignTsunami']);
    let comment = eq['comments']['freeFormComment'];
    let Time = eq['earthquake']['time'];

    let eqLat = eq["earthquake"]["hypocenter"]["latitude"];
    let eqLng = eq["earthquake"]["hypocenter"]["longitude"];
    let isEpicenterValid = (eqLat >= -90 && eqLat <= 90 && eqLng >= -180 && eqLng <= 180);
    let shingenLngLat = [eqLng, eqLat];
    
    if (isEpicenterValid) {
        let shingenEl = document.createElement('div');
        shingenEl.style.backgroundImage = 'url(source/shingen.png)';
        shingenEl.style.width = '40px';
        shingenEl.style.height = '40px';
        shingenEl.style.backgroundSize = 'cover';
        shingenEl.style.zIndex = "100";

        let shingenPopup = new maplibregl.Popup({ offset: 20, closeButton: false, maxWidth: 'none' })
            .setHTML('発生時刻：'+Time+'<br>最大震度：'+maxIntText+'<br>震源地：'+Name+
                     '<span style="font-size: 85%;"> ('+eqLat+", "+eqLng+')</span><br>規模：M'+Magnitude+' 深さ：'+Depth+
                     '<br>受信：'+eq['issue']['time']+', '+eq['issue']['source']);

        let shingenIcon = new maplibregl.Marker({ element: shingenEl })
            .setLngLat(shingenLngLat)
            .setPopup(shingenPopup)
            .addTo(map);

        shingenEl.addEventListener('mouseenter', () => shingenIcon.togglePopup());
        shingenEl.addEventListener('mouseleave', () => shingenIcon.togglePopup());
        currentMarkers.push(shingenIcon);
    }

    var datekari = eq['issue']['time'];
    document.getElementById('eqrele').innerHTML = datekari.substring(0,4)+'年'+datekari.substring(5,7)+'月'+datekari.substring(8,10)+'日'+datekari.substring(11,13)+'時'+datekari.substring(14,16)+'分'+datekari.substring(17,19)+'秒 発表';
    datekari = eq['earthquake']['time'];
    document.getElementById('eqtime').innerHTML = datekari.substring(0,4)+'年'+datekari.substring(5,7)+'月'+datekari.substring(8,10)+'日 <br class="block">'+datekari.substring(11,13)+'時'+datekari.substring(14,16)+'分ごろ';

    if (eq["issue"]["type"] == "Foreign") {
        document.getElementById('depth_wrapper').style.display = "none";
        document.getElementById('maxint_wrapper').style.display = "none";
        document.getElementById('shindo_legend').style.display = "none";
        document.getElementById('abroadtsunami').style.display = "block";
    } else {
        document.getElementById('title').innerText = "地震情報";
        document.getElementById('depth_wrapper').style.display = "";
        document.getElementById('maxint_wrapper').style.display = "";
        document.getElementById('shindo_legend').style.display = "";
        document.getElementById('magn_wrapper').style.display = "";
        document.getElementById('eqtsunami').style.display = "";
        document.getElementById('abroadtsunami').style.display = "none";
        document.getElementById('eqmint').innerText = maxIntText;
        document.getElementById('eqdepth').innerText = Depth;
    }

    document.getElementById('eqepic').innerText = Name;
    document.getElementById('eqmagn').innerText = Magnitude;
    document.getElementById('eqtsunami').innerText = tsunamiText;
    document.getElementById('abroadtsunami').innerText = tsunamiTextabroad;
    document.getElementById('eqcomment').innerText = comment;

    let sp_info = "";
    if (eq["issue"]["type"] == "ScalePrompt") {
        sp_info ="発生時刻："+Time+"頃\n震源地：調査中\n最大震度："+maxIntText+"\n"+tsunamiText;
    } else if (eq["issue"]["type"] == "Destination") {
        sp_info = "発生時刻："+Time+"頃\n震源地："+Name+"\nマグニチュード：M"+Magnitude+"\n深さ："+Depth+"\n"+tsunamiText;
    } else if (eq["issue"]["type"] == "Foreign"){
        sp_info = "発生時刻："+Time+"頃\n震源地："+Name+"\nマグニチュード：M"+Magnitude+"\n"+tsunamiText;
    } else {
        sp_info = "発生時刻："+Time+"頃\n震源地："+Name+"\nマグニチュード：M"+Magnitude+"\n深さ："+Depth+"\n最大震度："+maxIntText+"\n"+tsunamiText;
    }
    document.getElementById('sp_eqinfo').innerText = sp_info;

    var icon_theme = "jqk";
    var activePolygons = []; 
    var activePoints = [];   

    if (eq["issue"]["type"] != "ScalePrompt") {
        eq["points"].forEach(element => {
            var result = JMAPoints.indexOf(element["addr"]);
            if (result != -1) {
                var PointShindo = getShindoText(element["scale"]);
                let scaleStr = element["scale"] ? element["scale"] : 99; 
                
                if (element["isArea"] == false) { 
                    activePoints.push({
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [JMAPointsJson[result]["lon"], JMAPointsJson[result]["lat"]] },
                        properties: {
                            icon: `shindo-${scaleStr}`,
                            name: element["addr"],
                            furigana: JMAPointsJson[result]["furigana"],
                            shindoText: PointShindo,
                            sortKey: element["scale"] || 0   // ← 追加
                        }
                    });

                    var areaCode = AreaNameToCode(JMAPointsJson[result]["area"]["name"]);
                    if ((!filled_list[areaCode]) || filled_list[areaCode] < element["scale"]) {
                        filled_list[areaCode] = element["scale"];
                    }
                }
            }
        });

        for (let key in filled_list) {
            let PointColor = getPointColor(filled_list[key], icon_theme);
            let feature = createPolygonFeature(key, PointColor);
            if(feature) activePolygons.push(feature);
        }
    } else { 
        document.getElementById('title').innerText = "震度速報";
        document.getElementById('depth_wrapper').style.display = "none";
        document.getElementById('magn_wrapper').style.display = "none";
        
        var latList = [];
        var lonList = [];

        eq["points"].forEach(element => {
            var PointShindo = getShindoText(element["scale"]);
            var PointColor = getPointColor(element["scale"], icon_theme);
            let scaleStr = element["scale"] ? element["scale"] : 99; 
            
            var area_Code = AreaNameToCode(element["addr"]);
            let feature = createPolygonFeature(area_Code, PointColor);
            if(feature) activePolygons.push(feature);

            let latlon = centerPoint[area_Code];
            if (latlon) {
                latList.push(Number(latlon["lat"]));
                lonList.push(Number(latlon["lng"]));

                activePoints.push({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [latlon.lng, latlon.lat] },
                    properties: {
                        icon: `shindo-${scaleStr}`,
                        name: element["addr"],
                        furigana: AreaNameToKana(element["addr"]),
                        shindoText: PointShindo,
                        sortKey: element["scale"] || 0   // ← 追加
                    }
                });
            }
        });

        if(latList.length > 0 && lonList.length > 0) {
            const aryMax = function (a, b) {return Math.max(a, b);}
            const aryMin = function (a, b) {return Math.min(a, b);}
            shingenLngLat = [(lonList.reduce(aryMax)+lonList.reduce(aryMin))/2, (latList.reduce(aryMax)+latList.reduce(aryMin))/2];
            isEpicenterValid = true; 
        }
    }

    if(map.getSource('filled-areas')) map.getSource('filled-areas').setData({ type: 'FeatureCollection', features: activePolygons });
    if(map.getSource('shindo-points')) map.getSource('shindo-points').setData({ type: 'FeatureCollection', features: activePoints });

    if (eq["issue"]["type"] == "Destination") {
        document.getElementById('title').innerText = "震源情報";
        document.getElementById('maxint_wrapper').style.display = "none";
        document.getElementById('shindo_legend').style.display = "none";
    }

    if (isEpicenterValid) {
        if (eq["issue"]["type"] == "Foreign") {
            map.flyTo({ center: shingenLngLat, zoom: 3, duration: 500 });
        } else {
            map.flyTo({ center: shingenLngLat, zoom: 7, duration: 500 });
        }
    } else {
        map.flyTo({ center: [137.984, 36.575], zoom: 5, duration: 500 });
    }

    if (eq['comments']['freeFormComment'] == "") {
        document.getElementsByClassName('comment')[0].style.display = "none";
    } else {
        document.getElementsByClassName('comment')[0].style.display = "block";
    }
}

function createPolygonFeature(area_Code, PointColor) {
    var array_Num = AreaCode.indexOf(area_Code);
    if (array_Num != -1) {
        let feature = JSON.parse(JSON.stringify(japan_data.features[array_Num]));
        feature.properties.fillColor = PointColor;
        return feature;
    }
    return null;
}

// ユーティリティ関数
function getShindoText(scale) {
    if (scale == 10) return "震度1";
    if (scale == 20) return "震度2";
    if (scale == 30) return "震度3";
    if (scale == 40) return "震度4";
    if (scale == 45) return "震度5弱";
    if (scale == 46) return "震度5弱以上と推定";
    if (scale == 50) return "震度5強";
    if (scale == 55) return "震度6弱";
    if (scale == 60) return "震度6強";
    if (scale == 70) return "震度7";
    return "震度不明";
}

function getPointColor(scale, theme) {
    let colorVar = "";
    if (scale == 10) colorVar = `${theme}_backColor_1`;
    else if (scale == 20) colorVar = `${theme}_backColor_2`;
    else if (scale == 30) colorVar = `${theme}_backColor_3`;
    else if (scale == 40) colorVar = `${theme}_backColor_4`;
    else if (scale == 45 || scale == 46) colorVar = `${theme}_backColor_50`;
    else if (scale == 50) colorVar = `${theme}_backColor_55`;
    else if (scale == 55) colorVar = `${theme}_backColor_60`;
    else if (scale == 60) colorVar = `${theme}_backColor_65`;
    else if (scale == 70) colorVar = `${theme}_backColor_7`;
    else colorVar = `${theme}_backColor__`;
    
    try {
        return eval(colorVar);
    } catch (e) {
        return "#3a3a3a"; 
    }
}

function AreaNameToCode(Name) {
    var array_Num = AreaName.indexOf(Name);
    return AreaCode[array_Num];
}
function AreaCodeToName(code) {
    var array_Num = AreaCode.indexOf(code);
    return AreaName[array_Num];
}
function AreaNameToKana(Name) {
    var array_Num = AreaName.indexOf(Name);
    return AreaKana[array_Num];
}
function hantei_maxIntText(param) {
    let kaerichi = param == 10 ? "1" : param == 20 ? "2" : param == 30 ? "3" : param == 40 ? "4" :
    param == 45 ? "5弱" : param == 46 ? "5弱" : param == 50 ? "5強" : param == 55 ? "6弱" :
    param == 60 ? "6強" : param == 70 ? "7" : "不明";
    return kaerichi;
}
function hantei_Magnitude(param) {
    let kaerichi = param != -1 ? param.toFixed(1) : '0.0';
    return kaerichi;
}
function hantei_Name(param) {
    let kaerichi = param != "" ? param : '震源 調査中';
    return kaerichi;
}
function hantei_Depth(param) {
    let kaerichi = param === 0 ? 'ごく浅い' : param != -1 ? "約"+param+"Km" : '不明';
    return kaerichi;
}
function hantei_tsunamiText(param) {
    let kaerichi = param == "None" ? "この地震による津波の心配はありません。" :
    param == "Unknown" ? "不明" :
    param == "Checking" ? "津波については現在気象庁で調査しています。" :
    param == "NonEffective" ? "津波予報（若干の海面変動）が予想されますが\n被害の心配はありません。" :
    param == "Watch" ? "この地震について、津波注意報が発表されています。" :
    param == "Warning" ? "大津波警報・津波警報\nのいずれかが発表されています。" : "情報なし";
    return kaerichi;
}
function hantei_tsunamiText_abroad(param) {
    let kaerichi = param == "None" ? "この地震による津波の心配はありません。" :
    param == "Unknown" ? "不明" :
    param == "Checking" ? "津波については現在調査中です。" :
    param == "NonEffectiveNearby" ? "震源の近傍で小さな津波の可能性がありますが\n津波の影響はありません。" :
    param == "WarningNearby" ? "震源の近傍で小さな津波発生の可能性があります。" :
    param == "WarningPacific" ? "太平洋で津波発生の可能性があります。" :
    param == "WarningPacificWide" ? "太平洋の広域で津波発生の可能性があります。" :
    param == "WarningIndian" ? "インド洋で津波発生の可能性があります。" :
    param == "WarningIndianWide" ? "インド洋の広域で津波発生の可能性があります。" :
    param == "Potential" ? "津波発生の可能性があります。" : "情報なし";
    return kaerichi;
}