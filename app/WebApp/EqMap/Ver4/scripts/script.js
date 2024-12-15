var QuakeJson;
var JMAPointsJson;

var map = L.map('map', {
    preferCanvas: true,
    scrollWheelZoom: false,
    smoothWheelZoom: true,
    smoothSensitivity: 1.5,
}).setView([36.575, 137.984], 6);
L.control.scale({ maxWidth: 150, position: 'bottomright', imperial: false }).addTo(map);
map.zoomControl.setPosition('topright');

//地図に表示させる上下の順番
map.createPane("pane_map1").style.zIndex = 1; //地図（背景）
map.createPane("pane_map2").style.zIndex = 2; //地図（市町村）
map.createPane("pane_map3").style.zIndex = 3; //地図（細分）
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

var japan_data;
$.getJSON("https://miyakocam.github.io/geojsons/saibun.geojson", function (data) {
    japan_data = data;
    L.geoJson(data, {
        pane: "pane_map3",
        style: PolygonLayer_Style_nerv
    }).addTo(map);
});

$.getJSON("../Ver3/JMAstations.json", function (data) {
    JMAPointsJson = data;
    GetQuake();
});

//ボタン押下時のイベント設定とローカルストレージの設定
document.getElementById('reload').addEventListener("click",()=>{
    if (document.getElementById('reload_num').value != "") {
        if (document.getElementById('reload_num').value > 100 || document.getElementById('reload_num').value <= 0) {
            GetQuake(100);
        } else {
            GetQuake(document.getElementById('reload_num').value);
        }
    } else {
        GetQuake();
    }
    document.getElementById('reload').innerText = "更新中…";
    setTimeout(() => {
        document.getElementById('reload').innerText = "更新完了";
        setTimeout(() => {
            document.getElementById('reload').innerText = "情報更新";
        }, 1000);
    }, 1000);
});

function GetQuake(option) {
    var url;
    if (!isNaN(option)) {
        url = "https://api.p2pquake.net/v2/history?codes=551&limit="+option;
    } else {
        url = "https://api.p2pquake.net/v2/history?codes=551&limit=20";
    }
    $.getJSON(url, function (data) {
        QuakeJson = data;

        while (document.getElementById('quakelist').lastChild) {
            document.getElementById('quakelist').removeChild(document.getElementById('quakelist').lastChild);
        }
    
        var forEachNum = 0;
        data.forEach(element => {
            var option = document.createElement("option");
            var text;
            let maxInt_data = element['earthquake']['maxScale'];
            let maxIntText = hantei_maxIntText(maxInt_data);
            let Name = hantei_Name(element['earthquake']['hypocenter']['name']);
            let Time = element['earthquake']['time'];
            if (element["issue"]["type"] == "ScalePrompt") {
                text = "【震度速報】" + element["points"][0]["addr"] + "など " + "\n" + Time.slice(0, -3) + "\n最大震度 : " + maxIntText;
            } else if (element["issue"]["type"] == "Foreign") {
                text = "【遠地地震】" + Time.slice(0, -3) + " " + Name;
            } else {
                text = Time.slice(0, -3) + " " + Name + " " +  "\n" + "\n最大震度 : " + maxIntText;
            }
            option.value = "" + forEachNum + "";
            option.textContent = text;
            document.getElementById('quakelist').appendChild(option);
            forEachNum++;
        });
    
        //地震情報リストをクリックしたときの発火イベント
        var list = document.getElementById('quakelist');
        list.onchange = event => {
            QuakeSelect(list.selectedIndex);
        }
        
        QuakeSelect(0);
    });
}

var shingenIcon;
var shindo_icon;
var shindo_layer = L.layerGroup();
var shindo_filled_layer = L.layerGroup();
var filled_list = {};

function QuakeSelect(num) {
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
    var Time = QuakeJson[num]['earthquake']['time'];

    var shingenLatLng = new L.LatLng(QuakeJson[num]["earthquake"]["hypocenter"]["latitude"], QuakeJson[num]["earthquake"]["hypocenter"]["longitude"]);
    var shingenIconImage = L.icon({
        iconUrl: 'source/shingen.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -40]
    });
    shingenIcon = L.marker(shingenLatLng, {icon: shingenIconImage }).addTo(map);
    shingenIcon.bindPopup('発生時刻：'+Time+'<br>最大震度：'+maxIntText+'<br>震源地：'+Name+'<span style=\"font-size: 85%;\"> ('+QuakeJson[num]["earthquake"]["hypocenter"]["latitude"]+", "+QuakeJson[num]["earthquake"]["hypocenter"]["longitude"]+')</span><br>規模：M'+Magnitude+'　深さ：'+Depth+'<br>受信：'+QuakeJson[num]['issue']['time']+', '+QuakeJson[num]['issue']['source'],{closeButton: false, zIndexOffset: 10000, maxWidth: 10000});
    shingenIcon.on('mouseover', function (e) {this.openPopup();});
    shingenIcon.on('mouseout', function (e) {this.closePopup();});

        //サイドバーの情報関連
        var info = ""+Time+""
        document.getElementById('eqtime').innerText = info;
    
        var info = ""+maxIntText+""
        document.getElementById('eqmint').innerText = info;
    
        var info = ""+Name+""
        document.getElementById('eqepic').innerText = info;
        
        var info = ""+Magnitude+""
        document.getElementById('eqmagn').innerText = info;
    
        var info = ""+Depth+""
        document.getElementById('eqdepth').innerText = info;
    
        var info = ""+tsunamiText+""
        document.getElementById('eqtsunami').innerText = info;
    
        //スマホ表示
        var info = "発生時刻："+Time+"\n震源地："+Name+"\nマグニチュード："+Magnitude+"\n深さ："+Depth+"\n最大震度："+maxIntText+"\n"+tsunamiText+""
        document.getElementById('sp_eqinfo').innerText = info;

    if (QuakeJson[num]["issue"]["type"] != "ScalePrompt") { //各地の震度に関する情報
        //観測点の震度についてすべての観測点に対して繰り返す
        QuakeJson[num]["points"].forEach(element => {
        var result = JMAPoints.indexOf(element["addr"]);
        if (result != -1) {
            var ImgUrl = "";
            var PointShindo = "";
            var icon_theme = "jqk";
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
        }
        });
    }
    map.addLayer(shindo_layer);
    map.addLayer(shindo_filled_layer);
    map.flyTo(shingenLatLng, 7.5, { duration: 0.5 })
}

function AreaNameToCode(Name) {
    var array_Num = AreaName.indexOf(Name);
    return AreaCode[array_Num];
}
function AreaCodeToName(code) {
    var array_Num = AreaCode.indexOf(code);
    return AreaName[array_Num];
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
        map.addLayer(Filled_Layer);
        var geodata = data_japan["geometry"]["coordinates"][0];
        let latlon;
        map.eachLayer(function (layer) {
            if (layer.myTag && layer.myTag === "Filled") {
                latlon = layer.getCenter();
            }
        });
        map.removeLayer(Filled_Layer);
        return latlon;
    }
}

function hantei_maxIntText(param) {
    let kaerichi = param == 10 ? "1" : param == 20 ? "2" : param == 30 ? "3" : param == 40 ? "4" :
    param == 45 ? "5弱" : param == 46 ? "5弱" : param == 50 ? "5強" : param == 55 ? "6弱" :
    param == 60 ? "6強" : param == 70 ? "7" : "不明";
    return kaerichi;
}
function hantei_Magnitude(param) {
    let kaerichi = param != -1 ? param.toFixed(1) : 'ー.ー';
    return kaerichi;
}
function hantei_Name(param) {
    let kaerichi = param != "" ? param : '情報なし';
    return kaerichi;
}
function hantei_Depth(param) {
    let kaerichi = param != -1 ? "約"+param+"km" : '不明';
    return kaerichi;
}
function hantei_tsunamiText(param) {
    let kaerichi = param == "None" ? "この地震による津波の心配はありません。" :
    param == "Unknown" ? "津波については現在不明となっています。" :
    param == "Checking" ? "津波については現在気象庁で調査しています。" :
    param == "NonEffective" ? "津波予報（若干の海面変動）が発表されています。" :
    param == "Watch" ? "この地震について、津波注意報が発表されています。" :
    param == "Warning" ? "大津波警報または津波警報が発表されています。" : "情報なし";
    return kaerichi;
}
