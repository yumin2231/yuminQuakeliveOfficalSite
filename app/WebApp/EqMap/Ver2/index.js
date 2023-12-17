var map = L.map('map',{
    zoomControl: false // default true
  })
var map = L.map('map').setView([37.7102, 139.8132], 6);
L.control.scale({ maxWidth: 150, position: 'bottomright', imperial: false }).addTo(map);
map.zoomControl.setPosition('topright');
var PolygonLayer_Style_nerv = {
"color": "#ffffff",
"weight": 1.5,
"opacity": 1,
"fillColor": "#3a3a3a",
"fillOpacity": 1}
$.getJSON("prefectures.geojson", function (data) {
L.geoJson(data, {
style: PolygonLayer_Style_nerv
}).addTo(map);
}); 