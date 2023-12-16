var map = L.map('map').setView([36.575, 137.984], 6);
L.control.scale({ maxWidth: 150, position: 'bottomright', imperial: false }).addTo(map);
map.zoomControl.setPosition('topright');
$.getJSON("prefectures.geojson", function (data) {
L.geoJson(data, {}).addTo(map);
}); 
