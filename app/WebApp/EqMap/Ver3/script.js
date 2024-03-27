var map = L.map('map',{zoomControl: false}).setView([38.333039, 140.26570], 6);
var PolygonLayer_Style_nerv = {
    "color": "#ffffff",
    "weight": 1.5,
    "opacity": 1,
    "fillColor": "#454545",
    "fillOpacity": 1
}
$.getJSON("prefectures.geojson", function (data) {
    L.geoJson(data, {
        style: PolygonLayer_Style_nerv
    }).addTo(map);
});
$.getJSON("https://api.p2pquake.net/v2/history?codes=551", function (data) {
    console.log(data["0"]["earthquake"]["hypocenter"]["name"]);
    var [time, name, shindo, magnitude, depth] = [
        data["0"]["earthquake"]["time"],
        data["0"]["earthquake"]["hypocenter"]["name"],
        data["0"]["earthquake"]["maxScale"],
        data["0"]["earthquake"]["hypocenter"]["magnitude"],
        data["0"]["earthquake"]["hypocenter"]["depth"]
    ]
    console.log(time+"ごろ、"+name+"で最大震度"+shindo/10+"の地震が発生しました。マグニチュードは"+magnitude+"、深さ"+depth+"kmと推定されています。");
    console.log();
    var shingenLatLng = new L.LatLng(data[0]["earthquake"]["hypocenter"]["latitude"], data[0]["earthquake"]["hypocenter"]["longitude"]);
    var shingenIconImage = L.icon({
        iconUrl: 'imges/shingen.png',
        iconSize: [40,40],
        iconAnchor: [20, 20],
        popupAnchor: [0,-40]
        });
        var shingenIcon = L.marker(shingenLatLng, {icon: shingenIconImage }).addTo(map);

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
                      data[0]['earthquake']['domesticTsunami'] == "NonEffective" ? "この地震について、若干の海面変動・津波予報が発表中です。<br>津波被害の心配はありません。" :
                      data[0]['earthquake']['domesticTsunami'] == "Watch" ? "この地震について、津波注意報が発表されています。" :
                      data[0]['earthquake']['domesticTsunami'] == "Warning" ? "この地震について、津波警報または大津波警報が発表されています。" : "情報なし";
    var Time = data[0]['earthquake']['time'];
    shingenIcon.bindPopup('発生時刻：'+Time+'<br>最大震度：'+maxIntText+'<br>震源地：'+Name+'<span style=\"font-size: 85%;\"> ('+data[0]["earthquake"]["hypocenter"]["latitude"]+", "+data[0]["earthquake"]["hypocenter"]["longitude"]+')</span><br>規模：M'+Magnitude+'　深さ：'+Depth+'<br>受信：'+data[0]['issue']['time']+', '+data[0]['issue']['source'],{closeButton: false, zIndexOffset: 10000, maxWidth: 10000});
    shingenIcon.on('mouseover', function (e) {this.openPopup();});
    shingenIcon.on('mouseout', function (e) {this.closePopup();});

    var info = ""+data[0]["issue"]["time"]+""
    document.getElementById('eqrece').innerText = info;

    var info = ""+data[0]["earthquake"]["time"]+""
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
});
function updateCurrentTime() {
    const currentTimeElement = document.getElementById('current-time');
    const currentTime = new Date().toLocaleString('ja-JP');
    currentTimeElement.textContent = currentTime;
  }
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);
  
  setTimeout(function(){
    window.location.href = 'index.html';
}, 60*1000);