//adding features by akki
var QuakeJson;
var JMAPointsJson;
var countries_data;

var map = L.map('map', {
    preferCanvas: true,
    scrollWheelZoom: false,
    ScaleLine: false,
    smoothWheelZoom: true,
    smoothSensitivity: 1.5,
    zoomControl: false,
    maxZoom: 10,
    minZoom: 2
}).setView([36.575, 137.984], 6);
L.control.scale({ maxWidth: 150, imperial: false }).addTo(map);


//地図に表示させる上下の順番
map.createPane("world_map").style.zIndex = 2; //世界地図
map.createPane("pane_map2").style.zIndex = 3; //地図（市町村）
map.createPane("pane_map3").style.zIndex = 4; //地図（細分）
map.createPane("pane_map_filled").style.zIndex = 5; //塗りつぶし
map.createPane("shindo10").style.zIndex = 10;
map.createPane("shindo20").style.zIndex = 20;
map.createPane("shindo30").style.zIndex = 30;
map.createPane("shindo40").style.zIndex = 40;
map.createPane("shindo45").style.zIndex = 45;
map.createPane("shindo46").style.zIndex = 46;
map.createPane("shindo50").style.zIndex = 50;
map.createPane("shindo55").style.zIndex = 55;
map.createPane("shindo60").style.zIndex = 60;
map.createPane("shindo70").style.zIndex = 70;
map.createPane("shingen").style.zIndex = 100; //震源
map.createPane("tsunami_map").style.zIndex = 110; //津波

var PolygonLayer_Style_nerv = {
    "color": "#ffffff",
    "weight": 1.5,
    "opacity": 1,
    "fillColor": "#3a3a3a",
    "fillOpacity": 1
}
var PolygonLayer_Style_world = {
    "color": "#ffffff",
    "weight": 1.5,
    "opacity": 1,
    "fillColor": "#3a3a3a",
    "fillOpacity": 1
}

//地震情報リストをクリックしたときの発火イベント
var list = document.getElementById('quakelist');
list.onchange = event => {
    Cookies.set("listSelectedIndex", list.selectedIndex);
    QuakeSelect(list.selectedIndex);
}
//ボタン押下時のイベント設定とローカルストレージの設定
document.getElementById('reload').addEventListener("click",()=>{
    if (document.getElementById('reload_num').value != "") {
        if (document.getElementById('reload_num').value > 100 || document.getElementById('reload_num').value <= 0) {
            reloadData(100)
        } else {
            reloadData(document.getElementById('reload_num').value);
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
};

(async () => {
    await Promise.all([
        GetJson(),
        GetSaibun(),
        GetQuake()
    ]);
    Cookies.set("listSelectedIndex", 0);
    QuakeSelect(0);
    // ローディング画面を非表示
    document.getElementById('loading').style.display = "none";
})();

var japan_data;
var world_data;
async function GetSaibun() {
    const [saibunResponse, worldResponse, additionalGeoJsonResponse] = await Promise.all([
        fetch("source/saibun.geojson"),
        fetch("source/World.geojson")
    ]);
    
    japan_data = await saibunResponse.json();
    world_data = await worldResponse.json();

    L.geoJson(world_data, {
        pane: "world_map",
        style: PolygonLayer_Style_world,
    }).addTo(map);

    L.geoJson(japan_data, {
        pane: "pane_map3",
        style: PolygonLayer_Style_nerv
    }).addTo(map);

    L.geoJson(countries_data, {
        pane: "pane_map3",
        style: PolygonLayer_Style_world
    }).addTo(map);
}
async function GetJson() {
    const response = await fetch("source/JMAstations.json");
    JMAPointsJson = await response.json();
}

async function GetQuake(option) {
    var url;
    if (!isNaN(option)) {
        url = "https://api.p2pquake.net/v2/history?codes=551&limit="+option;
    } else {
        url = "https://api.p2pquake.net/v2/history?codes=551&limit=20";
    }
    
    const response = await fetch(url);
    QuakeJson = await response.json();

    while (document.getElementById('quakelist').lastChild) {
        document.getElementById('quakelist').removeChild(document.getElementById('quakelist').lastChild);
    }

    var forEachNum = 0;
    QuakeJson.forEach(element => {
        document.getElementById('title').innerText = "地震情報";
        var option = document.createElement("option");
        var text;
        let maxInt_data = element['earthquake']['maxScale'];
        let maxIntText = hantei_maxIntText(maxInt_data);
        let Name = hantei_Name(element['earthquake']['hypocenter']['name']);
        let Time = element['earthquake']['time'];
        if (element["issue"]["type"] == "ScalePrompt") { //震度速報
            text = "【震度速報】" + element["points"][0]["addr"] + "など" + "\n" + Time.slice(0, -3) + "\n最大震度 : " + maxIntText;
        } else if (element["issue"]["type"] == "Destination") { //震源情報
            text = "【震源情報】" + Time.slice(0, -3) + " " + Name;
        } else if (element["issue"]["type"] == "Foreign") { //遠地地震
            text = "【遠地地震】" + Time.slice(0, -3) + " " + Name;
        } else {
            text = Time.slice(0, -3) + " " + Name + " " +  "\n" + "\n最大震度 : " + maxIntText;
        }
        option.value = "" + forEachNum + "";
        option.textContent = text;
        document.getElementById('quakelist').appendChild(option);
        forEachNum++;
    });
}

var shingenIcon;
var shindo_icon;
var shindo_layer = L.layerGroup();
var shindo_filled_layer = L.layerGroup();
var filled_list = {};

async function QuakeSelect(num) {
    list.options[Cookies.get("listSelectedIndex")].selected = true;

    if (shingenIcon && shindo_layer && shindo_filled_layer) {
        map.removeLayer(shingenIcon);
        map.removeLayer(shindo_layer);
        map.removeLayer(shindo_filled_layer);
        shingenIcon = "";
        shindo_layer = L.layerGroup();
        shindo_filled_layer = L.layerGroup();
        filled_list = {};
        shindo_icon = "";
    }
    let maxInt_data = QuakeJson[num]['earthquake']['maxScale'];
    var maxIntText = hantei_maxIntText(maxInt_data);
    var Magnitude = hantei_Magnitude(QuakeJson[num]['earthquake']['hypocenter']['magnitude']);
    var Name = hantei_Name(QuakeJson[num]['earthquake']['hypocenter']['name']);
    var Depth = hantei_Depth(QuakeJson[num]['earthquake']['hypocenter']['depth']);
    var tsunamiText = hantei_tsunamiText(QuakeJson[num]['earthquake']['domesticTsunami']);
    var tsunamiTextabroad = hantei_tsunamiText_abroad(QuakeJson[num]['earthquake']['foreignTsunami']);
    var comment = QuakeJson[num]['comments']['freeFormComment'];
    var Time = QuakeJson[num]['earthquake']['time'];

    var shingenLatLng = new L.LatLng(QuakeJson[num]["earthquake"]["hypocenter"]["latitude"], QuakeJson[num]["earthquake"]["hypocenter"]["longitude"]);
    var shingenIconImage = L.icon({
        iconUrl: 'source/shingen.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -40]
    });
    
    var icon_theme = "jqk";
    shingenIcon = L.marker(shingenLatLng, {icon: shingenIconImage }).addTo(map);
    shingenIcon.bindPopup('発生時刻：'+Time+'<br>最大震度：'+maxIntText+'<br>震源地：'+Name+'<span style=\"font-size: 85%;\"> ('+QuakeJson[num]["earthquake"]["hypocenter"]["latitude"]+", "+QuakeJson[num]["earthquake"]["hypocenter"]["longitude"]+')</span><br>規模：M'+Magnitude+'　深さ：'+Depth+'<br>受信：'+QuakeJson[num]['issue']['time']+', '+QuakeJson[num]['issue']['source'],{closeButton: false, zIndexOffset: 10000, maxWidth: 10000});
    shingenIcon.on('mouseover', function (e) {this.openPopup();});
    shingenIcon.on('mouseout', function (e) {this.closePopup();});

            //サイドバーの情報関連
            var datekari = QuakeJson[num]['issue']['time'];
            let info_1danme = datekari.substring(0,4)+'年'+datekari.substring(5,7)+'月'+datekari.substring(8,10)+'日'+datekari.substring(11,13)+'時'+datekari.substring(14,16)+'分'+datekari.substring(17,19)+'秒 発表';
            document.getElementById('eqrele').innerHTML = info_1danme;
    
            var datekari = QuakeJson[num]['earthquake']['time'];
            let info_2danme = datekari.substring(0,4)+'年'+datekari.substring(5,7)+'月'+datekari.substring(8,10)+'日 <br class="block">'+datekari.substring(11,13)+'時'+datekari.substring(14,16)+'分ごろ';
            document.getElementById('eqtime').innerHTML = info_2danme;
        
            // 国外地震の場合は深さと最大震度と凡例を表示しない
            if (QuakeJson[num]["issue"]["type"] == "Foreign") {
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
                document.getElementById('eir').style.display = "";
                document.getElementById('eqtsunami').style.display = "";
                document.getElementById('abroadtsunami').style.display = "none";

                document.getElementById('eqmint').innerText = maxIntText;
                document.getElementById('eqdepth').innerText = Depth;
            }
        
            var info = ""+Name+""
            document.getElementById('eqepic').innerText = info;
            
            var info = ""+Magnitude+""
            document.getElementById('eqmagn').innerText = info;
        
            var info = ""+tsunamiText+""
            document.getElementById('eqtsunami').innerText = info;
            
            var info = ""+tsunamiTextabroad+""
            document.getElementById('abroadtsunami').innerText = info;
            
            var info = ""+comment+""
            document.getElementById('eqcomment').innerText = info;
        
            //スマホ表示
            if (QuakeJson[num]["issue"]["type"] == "ScalePrompt") {
                var info ="発生時刻："+Time+"頃\n震源地：調査中\n最大震度："+maxIntText+"\n"+tsunamiText+"" //震度速報
             } 
             
             else if (QuakeJson[num]["issue"]["type"] == "Destination") {
                 var info = "発生時刻："+Time+"頃\n震源地："+Name+"\nマグニチュード：M"+Magnitude+"\n深さ："+Depth+"\n"+tsunamiText+"" //震源情報
             } 
             
             else if (QuakeJson[num]["issue"]["type"] == "Foreign"){
                 var info = "発生時刻："+Time+"頃\n震源地："+Name+"\nマグニチュード：M"+Magnitude+"\n"+tsunamiText+"" //遠地地震
             } 
             
             else {
                 var info = "発生時刻："+Time+"頃\n震源地："+Name+"\nマグニチュード：M"+Magnitude+"\n深さ："+Depth+"\n最大震度："+maxIntText+"\n"+tsunamiText+"" //通常
             }
            document.getElementById('sp_eqinfo').innerText = info;

    if (QuakeJson[num]["issue"]["type"] != "ScalePrompt") { //各地の震度に関する情報
        //観測点の震度についてすべての観測点に対して繰り返す
        QuakeJson[num]["points"].forEach(element => {
        var result = JMAPoints.indexOf(element["addr"]);
        if (result != -1) {
            var ImgUrl = "";
            var PointShindo = "";
            if (element["scale"] == 10) {
                ImgUrl = "source/"+icon_theme+"_int1.png";
                PointShindo = "震度1";
            } else if (element["scale"] == 20) {
                ImgUrl = "source/"+icon_theme+"_int2.png";
                PointShindo = "震度2";
            } else if (element["scale"] == 30) {
                ImgUrl = "source/"+icon_theme+"_int3.png";
                PointShindo = "震度3";
            } else if (element["scale"] == 40) {
                ImgUrl = "source/"+icon_theme+"_int4.png";
                PointShindo = "震度4";
            } else if (element["scale"] == 45) {
                ImgUrl = "source/"+icon_theme+"_int50.png";
                PointShindo = "震度5弱";
            } else if (element["scale"] == 46) {
                ImgUrl = "source/"+icon_theme+"_int_.png";
                PointShindo = "震度5弱以上と推定";
            } else if (element["scale"] == 50) {
                ImgUrl = "source/"+icon_theme+"_int55.png";
                PointShindo = "震度5強";
            } else if (element["scale"] == 55) {
                ImgUrl = "source/"+icon_theme+"_int60.png";
                PointShindo = "震度6弱";
            } else if (element["scale"] == 60) {
                ImgUrl = "source/"+icon_theme+"_int65.png";
                PointShindo = "震度6強";
            } else if (element["scale"] == 70) {
                ImgUrl = "source/"+icon_theme+"_int7.png";
                PointShindo = "震度7";
            } else {
                ImgUrl = "source/"+icon_theme+"_int_.png";
                PointShindo = "震度不明";
            }
            if (element["isArea"] == false) { //観測点
                console.log(result);
                let shindo_latlng = new L.LatLng(JMAPointsJson[result]["lat"], JMAPointsJson[result]["lon"]);
                let shindoIcon = L.icon({
                    iconUrl: ImgUrl,
                    iconSize: [20, 20],
                    popupAnchor: [0, -40]
                });
                let shindoIcon_big = L.icon({
                    iconUrl: ImgUrl,
                    iconSize: [34, 34],
                    popupAnchor: [0, -40]
                });
                shindo_icon = L.marker(shindo_latlng, { icon: shindoIcon,pane: eval('\"shindo'+element["scale"]+'\"') });
                shindo_icon.bindPopup('<ruby>'+element["addr"] + '<rt style="font-size: 0.7em;">' + JMAPointsJson[result]["furigana"] + '</rt></ruby>　'+ PointShindo,{closeButton: false, zIndexOffset: 10000,autoPan: false,});
                shindo_icon.on('mouseover', function (e) {
                    this.openPopup();
                });
                shindo_icon.on('mouseout', function (e) {
                    this.closePopup();
                });
                shindo_layer.addLayer(shindo_icon);

                //塗りつぶしの設定をする
                //AreaNameToCode()は下を参照。大阪府北部を520等に変換
                //filled_listは連想配列で{520: 10, 120: 20}など、エリアコード: 震度の大きさ
                var areaCode = AreaNameToCode(JMAPointsJson[result]["area"]["name"]);
                //filled_listにエリアコードがなかったり、さらに大きな震度になっていたら更新
                if ((!filled_list[areaCode]) || filled_list[areaCode] < element["scale"]) {
                    filled_list[areaCode] = element["scale"];
                }
            }
        }
        });
        //for(... in ...)もforEachと同等。keyに連想配列の名前が入る
        for (key in filled_list){ 
            var PointColor;
            if (filled_list[key] == 10) {
                eval('PointColor = '+icon_theme+'_backColor_1');
            } else if (filled_list[key] == 20) {
                eval('PointColor = '+icon_theme+'_backColor_2');
            } else if (filled_list[key] == 30) {
                eval('PointColor = '+icon_theme+'_backColor_3');
            } else if (filled_list[key] == 40) {
                eval('PointColor = '+icon_theme+'_backColor_4');
            } else if (filled_list[key] == 45) {
                eval('PointColor = '+icon_theme+'_backColor_50');
            } else if (filled_list[key] == 46) {
                eval('PointColor = '+icon_theme+'_backColor_50');
            } else if (filled_list[key] == 50) {
                eval('PointColor = '+icon_theme+'_backColor_55');
            } else if (filled_list[key] == 55) {
                eval('PointColor = '+icon_theme+'_backColor_60');
            } else if (filled_list[key] == 60) {
                eval('PointColor = '+icon_theme+'_backColor_65');
            } else if (filled_list[key] == 70) {
                eval('PointColor = '+icon_theme+'_backColor_7');
            }
            //引数"key"はエリアコード、"PointColor"は塗りつぶし色のHEX値
            FillPolygon(key, PointColor);
        }
    } else { //震度速報
        document.getElementById('title').innerText = "震度速報";
        document.getElementById('depth_wrapper').style.display = "none";
        document.getElementById('magn_wrapper').style.display = "none";
        document.getElementById('eir').style.display = "none";
        var icon_theme = "jqk";
        var latlon;
        var latList = [];
        var lonList = [];
        QuakeJson[num]["points"].forEach(element => {
            var ImgUrl = "";
            var PointShindo = "";
            var PointColor;
            if (element["scale"] == 10) {
                eval('PointColor = '+icon_theme+'_backColor_1');
                ImgUrl = "source/"+icon_theme+"_int1.png";
                PointShindo = "震度1";
            } else if (element["scale"] == 20) {
                eval('PointColor = '+icon_theme+'_backColor_2');
                ImgUrl = "source/"+icon_theme+"_int2.png";
                PointShindo = "震度2";
            } else if (element["scale"] == 30) {
                eval('PointColor = '+icon_theme+'_backColor_3');
                ImgUrl = "source/"+icon_theme+"_int3.png";
                PointShindo = "震度3";
            } else if (element["scale"] == 40) {
                eval('PointColor = '+icon_theme+'_backColor_4');
                ImgUrl = "source/"+icon_theme+"_int4.png";
                PointShindo = "震度4";
            } else if (element["scale"] == 45) {
                eval('PointColor = '+icon_theme+'_backColor_50');
                ImgUrl = "source/"+icon_theme+"_int50.png";
                PointShindo = "震度5弱";
            } else if (element["scale"] == 46) {
                eval('PointColor = '+icon_theme+'_backColor_50');
                ImgUrl = "source/"+icon_theme+"_int_.png";
                PointShindo = "震度5弱以上と推定";
            } else if (element["scale"] == 50) {
                eval('PointColor = '+icon_theme+'_backColor_55');
                ImgUrl = "source/"+icon_theme+"_int55.png";
                PointShindo = "震度5強";
            } else if (element["scale"] == 55) {
                eval('PointColor = '+icon_theme+'_backColor_60');
                ImgUrl = "source/"+icon_theme+"_int60.png";
                PointShindo = "震度6弱";
            } else if (element["scale"] == 60) {
                eval('PointColor = '+icon_theme+'_backColor_65');
                ImgUrl = "source/"+icon_theme+"_int65.png";
                PointShindo = "震度6強";
            } else if (element["scale"] == 70) {
                eval('PointColor = '+icon_theme+'_backColor_7');
                ImgUrl = "source/"+icon_theme+"_int7.png";
                PointShindo = "震度7";
            } else {
                eval('PointColor = '+icon_theme+'_backColor__');
                ImgUrl = "source/"+icon_theme+"_int_.png";
                PointShindo = "震度不明";
            }
            var area_Code = AreaNameToCode(element["addr"]);
            latlon = FillPolygon(area_Code, PointColor);
            latList.push(Number(latlon["lat"]));
            lonList.push(Number(latlon["lng"]));
            let shindoIcon = L.icon({
                iconUrl: ImgUrl,
                iconSize: [30, 30],
                popupAnchor: [0, -50]
            });
            var shindo_icon = L.marker(latlon, { icon: shindoIcon,pane: eval('\"shindo'+element["scale"]+'\"') });
            shindo_icon.bindPopup('<ruby>'+element["addr"] + '<rt style="font-size: 0.7em;">' + AreaNameToKana(element["addr"]) + '</rt></ruby>　'+ PointShindo,{closeButton: false, zIndexOffset: 10000,autoPan: false,});
            shindo_icon.on('mouseover', function (e) {
                this.openPopup();
            });
            shindo_icon.on('mouseout', function (e) {
                this.closePopup();
            });
            shindo_layer.addLayer(shindo_icon);
            // console.log(element["addr"] + " " + PointShindo + " OK");
        });
        const aryMax = function (a, b) {return Math.max(a, b);}
        const aryMin = function (a, b) {return Math.min(a, b);}
        var latMax = latList.reduce(aryMax);
        var latMin = latList.reduce(aryMin);
        var lonMax = lonList.reduce(aryMax);
        var lonMin = lonList.reduce(aryMin);
        //通常時の位置初期化の位置
        shingenLatLng = new L.LatLng(Number((latMax+latMin)/2), Number((lonMax+lonMin)/2));
        latList = [];
        lonList = [];
    }
    map.addLayer(shindo_layer);
    map.addLayer(shindo_filled_layer);
    
    if (QuakeJson[num]["issue"]["type"] == "Destination") {
        document.getElementById('title').innerText = "震源情報";
        document.getElementById('maxint_wrapper').style.display = "none";
        document.getElementById('shindo_legend').style.display = "none";
    }

    // 国外地震かどうかを判定
    if (QuakeJson[num]["issue"]["type"] == "Foreign") {
        // 国外地震の場合は震源を中心にして縮尺を小さく
        map.flyTo(shingenLatLng, 4, { duration: 0.5 });
        document.getElementById('title').innerText = "遠地地震情報";
    } else {
        // 国内地震の場合は従来通り
        map.flyTo(shingenLatLng, 8, { duration: 0.5 });
    }

    //コメントに関する処理
    if (QuakeJson[num]['comments']['freeFormComment'] == "") {
        document.getElementsByClassName('comment')[0].style.display = "none";
    } else {
        document.getElementsByClassName('comment')[0].style.display = "block";
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

function FillPolygon(area_Code, PointColor) {
    var array_Num = AreaCode.indexOf(area_Code);
    if (array_Num != -1) {
        var style;
        style = {
            "color": "#ffffff",
            "weight": 1.2,
            "opacity": 1,
            "fillColor": PointColor,
            "fillOpacity": 1,
        }
        data_japan = japan_data["features"][array_Num];
        var Filled_Layer = L.geoJSON(data_japan, {
            style: style,
            pane: "pane_map_filled",
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.popupContent) {
                    layer.bindPopup(feature.properties.popupContent);
                }
                layer.myTag = "Filled"
            },
        });
        shindo_filled_layer.addLayer(Filled_Layer);
        let latlon = centerPoint[area_Code];
        return latlon;
    }
}

function hantei_maxIntText(param) {
    let kaerichi = param == 10 ? "1" : param == 20 ? "2" : param == 30 ? "3" : param == 40 ? "4" :
    param == 45 ? "5弱" : param == 46 ? "5弱" : param == 50 ? "5強" : param == 55 ? "6弱" :
    param == 60 ? "6強" : param == 70 ? "7" : "不明";
    return kaerichi;
}
function hantei_Magnitude(param) {//マグニチュード
    let kaerichi = param != -1 ? param.toFixed(1) : '0.0';
    return kaerichi;
}
function hantei_Name(param) {//震源
    let kaerichi = param != "" ? param : '震源 調査中';
    return kaerichi;
}
function hantei_Depth(param) {//規模
    let kaerichi = param === 0 ? 'ごく浅い' : param != -1 ? "約"+param+"Km" : '不明';
    return kaerichi;
}
function hantei_tsunamiText(param) {//日本津波
    let kaerichi = param == "None" ? "この地震による津波の心配はありません。" :
    param == "Unknown" ? "不明" :
    param == "Checking" ? "津波については現在気象庁で調査しています。" :
    param == "NonEffective" ? "津波予報（若干の海面変動）が予想されますが\n被害の心配はありません。" :
    param == "Watch" ? "この地震について、津波注意報が発表されています。" :
    param == "Warning" ? "大津波警報・津波警報\nのいずれかが発表されています。" : "情報なし";
    return kaerichi;
}

function hantei_tsunamiText_abroad(param) {//国外津波
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