var map = L.map('map',{zoomControl: false}).setView([37.7102, 139.8132], 6);
var PolygonLayer_Style_nerv = {
    "color": "#ffffff",
    "weight": 1.5,
    "opacity": 1,
    "fillColor": "#404040",
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

});
