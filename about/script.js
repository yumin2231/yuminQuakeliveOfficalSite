var map = L.map('map', {
    center: [36.077897, 140.206286],
    zoom: 17,
    maxZoom: 17
 });
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
L.marker([36.077897, 140.206286]).addTo(map)
      var resetButton = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        onAdd: function (map) {
           var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

           container.innerHTML = '<button onclick="resetMap()">位置初期化</button>';

           return container;
        }
     });

     map.addControl(new resetButton());
     function resetMap() {
        map.setView([36.077897, 140.206286], 17);
}