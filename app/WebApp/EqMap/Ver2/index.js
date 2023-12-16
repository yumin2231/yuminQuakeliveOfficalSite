var map = L.map('map').setView([36.575, 137.984], 6);
L.control.scale({ maxWidth: 150, position: 'bottomright', imperial: false }).addTo(map);
map.zoomControl.setPosition('topright');
var PolygonLayer_Style_nerv = {
"color": "#ffffff",
"weight": 1.5,
"opacity": 1,
"fillColor": "#3a3a3a",
"fillOpacity": 1}
$.getJSON("https://japonyol.net/editor/article/geo/prefectures.geojson", function (data) {
L.geoJson(data, {
style: PolygonLayer_Style_nerv
}).addTo(map);
}); 