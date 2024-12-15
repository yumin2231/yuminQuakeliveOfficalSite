$(function(){
	mapboxgl.accessToken = 'pk.eyJ1IjoidGF0dGlpIiwiYSI6ImNqMWFrZ3ZncjAwNmQzM3BmazRtNngxam8ifQ.DNMc6j7E4Gh7UkUAaEAPxA';
	var map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/tattii/cj3jrmgsp002i2rt50tobxo27',
		zoom: 5,
		center: [136.6, 35.5],
		attributionControl: false
	});
	map.fitBounds([[127, 24], [147, 46]]);
	map.touchZoomRotate.disableRotation();

	var marker;
	var popup = new mapboxgl.Popup({
		closeButton: false
	});
	var moving = false, zooming = false; // only pc

	var zoomThreshold = 6;
	var selected;

	var warningData = {};
	var warningColor = {
		none:      "rgba(255, 255, 255, 0)",
		advisory:  "rgba(255, 255, 0, 0.4)",
		warning:   "rgba(255, 0, 0, 0.4)",
		emergency: "rgba(138,43,226, 0.4)"
	};

	// responsive
	var $sidebar = $("#sidebar");
	var mobile = $(window).width() < 640;
	if (!mobile){ // pc
		$sidebar.removeClass("bottom").addClass("left");
		$("#sidebar-close").show();
		$("#sidebar-close").on("click", function(){
			$sidebar.sidebar("hide");
		});
	}

	// now location
	$("#location-button").on("click", function(){
		$("#location-popup").show();
		navigator.geolocation.getCurrentPosition(function(position) {
			$("#location-popup").hide();
			showPoint(position.coords.latitude, position.coords.longitude);
		},
		function(error) {
			alert(error.message);
		});
	});

	map.on("load", function() {
		addVtileSouce('pref');
		addVtileSouce('city');

		overlayWarning('pref');
		overlayWarning('city');
		
		addSelectLayer('pref');
		addSelectLayer('city');

		// map event

		if (_isTouchDevice()){
			map.on('mousemove', selectArea);

		}else{
			map.on('mousemove', hoverArea);
			map.on('click', selectArea);
			map.on('movestart', function (){ moving = true; });
			map.on('moveend',   function (){ moving = false; });
			map.on('zoomstart', function (){ zooming = true; });
			map.on('zoomend',   function (){ zooming = false; });
		}
	});

    function  _isTouchDevice() {
        return (('ontouchstart' in window)
                || (navigator.MaxTouchPoints > 0)
                || (navigator.msMaxTouchPoints > 0));
    }

	function hoverArea (e){
		if (moving || zooming) return false;

		var layer = (map.getZoom() <= zoomThreshold) ? 'pref' : 'city';
		var features = map.queryRenderedFeatures(e.point, { layers: ['warning-area-' + layer] });
		map.getCanvas().style.cursor = (features.length) ? 'crosshair' : '';

		if (!features.length) {
			popup.remove();
			return;
		}

		var feature = features[0];
		var name_prop = (layer == 'city') ? 'name' : layer + 'Name';
		var name = feature.properties[name_prop];
		var code_prop = (layer == 'city') ? 'code' : layer + 'Code';
		var code = feature.properties[code_prop];

		var warnings = warningData[layer][code].warnings;
		if (warnings.length){
			name += '&emsp;';
			for (var i in warnings){
				name += warningLabel(warnings[i]);
			}
		}

		popup.setLngLat(e.lngLat)
			.setHTML(name)
			.addTo(map);
	}

	function selectArea (e){
		var layer = (map.getZoom() <= zoomThreshold) ? 'pref' : 'city';
		var features = map.queryRenderedFeatures(e.point, { layers: ['warning-area-' + layer] });
		var layerId = 'selected-area-' + layer;

		// mobile click out of area
		if (!features.length){
			if (mobile && map.getLayer(layerId)){
				map.setFilter(layerId, ["==", "", ""]);
				selected = null;
				$sidebar.sidebar("hide");
			}
			return;
		}

		// show selected area on map
		if (!mobile) map.getCanvas().style.cursor = 'pointer';

		var code_prop = (layer == 'city') ? 'code' : layer + 'Code';
		var code = features[0].properties[code_prop];
		map.setFilter(layerId, ["==", code_prop, code]);

		if (layer == 'pref'){
			fitFeatureBounds(features[0], e.lngLat);
			map.setFilter('selected-area-city', ["==", "", ""]);

		}else{
			map.setFilter('selected-area-pref', ["==", "", ""]);
		}

		// show data on sidebar
		if (!selected || code != selected.code){
			updateSidebar(code, features[0], layer);
		}

		if ($sidebar.sidebar("is hidden")){
			$sidebar.sidebar('setting', 'transition', 'overlay')
			.sidebar('setting', 'dimPage', false)
			.sidebar('setting', 'closable', false)
			.sidebar('show');
		}

		selected = { layer: layer, feature: features[0], code: code };
	}


	function addVtileSouce (layer){
		var source_layer = ((layer == 'city') ? '' : layer) + 'allgeojson';

		map.addSource("vtile-" + layer, {
			"type": "vector",
			"minzoom": 0,
			"maxzoom": 10,
      "tiles": ["https://weatherbox.github.io/warning-area-vt/" + layer + "/{z}/{x}/{y}.pbf"],
			"attribution": '<a href="http://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-v2_3.html" target="_blank">国土数値情報</a>'
		});
	}

	function addSelectLayer (layer){
		var source_layer = ((layer == 'city') ? '' : layer) + 'allgeojson';

		map.addLayer({
			"id": "selected-area-" + layer,
			"type": "fill",
			"source": "vtile-" + layer,
			"source-layer": source_layer,
			"paint": {
				"fill-color": "rgba(126, 199, 216, 0.2)",
				"fill-outline-color": "rgba(0, 84, 153, 0.8)"
			},
			"filter": ["==", "code", ""]
		});
	}


	function overlayWarning (layer){
		$.get('https://s3-ap-northeast-1.amazonaws.com/vector-tile/warning/' + layer + '.json.gz', function (data){
			warningData[layer] = data[layer + 'list'];

			var source_layer = ((layer == 'city') ? '' : layer) + 'allgeojson';
			var code_prop = (layer == 'city') ? 'code' : layer + 'Code';

			var stops = [];
			for (var code in data[layer + 'list']){
				var status = data[layer + 'list'][code].status;
				stops.push([code, warningColor[status]]);
			}

			var layer_setting = {
				"id": "warning-area-" + layer,
				"type": "fill",
				"source": "vtile-" + layer,
				"source-layer": source_layer,
				"paint": {
					"fill-color": {
						"property": code_prop,
						"type": "categorical",
						"stops": stops
					},
					"fill-outline-color": "rgba(123, 124, 125, 0.7)"
				}
			};

			if (layer == 'pref'){
				layer_setting.maxzoom = zoomThreshold;
			}else{
				layer_setting.minzoom = zoomThreshold;
			}

			map.addLayer(layer_setting);
		});
	}

	function fitFeatureBounds (feature, lngLat){
		var coordinates = [];

		if (feature.properties.prefName == '東京都' && lngLat.lat > 35.4){ // tokyo main
			coordinates = feature.geometry.coordinates[27][0];

		}else if (feature.geometry.type == 'MultiPolygon'){
			for (var i in feature.geometry.coordinates){
				Array.prototype.push.apply(coordinates, feature.geometry.coordinates[i][0]);
			}

		}else if (feature.geometry.type == 'Polygon'){
			coordinates = feature.geometry.coordinates[0];
		}

		var bounds = coordinates.reduce(function(bounds, coord) {
			return bounds.extend(coord);
		}, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

		var padding = (mobile) ? 
			{ top: 10, bottom: 100, left: 10, right: 10 } :
			{ top: 20, bottom: 40, left: 150, right: 20 };

		map.fitBounds(bounds, {
			padding: padding
		});
	}

	function showPoint(lat, lon){
		console.log(lat, lon);
		if (!marker){
			var w = 12, h = 12, r = 6, fc = '#005B98';
			var xmls = "http://www.w3.org/2000/svg";
			var svg = document.createElementNS(xmls, 'svg');
			svg.setAttribute('width', w);
			svg.setAttribute('height', h);
			var c = document.createElementNS(xmls, 'circle');
			c.setAttribute('fill', fc);                
			c.setAttribute('cx', w/2);
			c.setAttribute('cy', h/2);
			c.setAttribute('r',r);
			svg.appendChild(c);

			marker = new mapboxgl.Marker(svg, { offset: [-w/2, -h/2] })
				.setLngLat([lon, lat]).addTo(map);
		}else{
			marker.setLngLat([lon, lat]);
		}

		var flylon = (mobile) ? lon : lon - 0.14;
		var flylat = (mobile) ? lat - 0.1 : lat;
		map.flyTo({center: [flylon, flylat], zoom: 9});

		var done = false;
		map.on("moveend", function (e){
			if (done) return false;
			map.off("moveend", this);
			setTimeout(function(){
				done = true;
				selectArea({ point: map.project([lon, lat]) });
			}, 500);
		});
	}

	function updateSidebar (code, feature, layer){
		var name_prop = (layer == 'city') ? 'name' : layer + 'Name';
		$("#sidebar-title h2").text(feature.properties[name_prop]);
		setJMALink(code, layer);

		var pcode = (layer == 'pref') ? code : feature.properties.prefCode;
		var comment = warningData['pref'][pcode].comment;
		var report_time = warningData['pref'][pcode].report_time;

		var labels = '';
		var warnings = warningData[layer][code].warnings;
		if (warnings.length){
			for (var i in warnings){
				labels += warningLabel(warnings[i]);
			}
		}else{
			comment = "気象警報・注意報は発表されていません"
		}

		if (mobile){
			$("#sidebar-title h2").append('<span>' + labels + '</span>');
		}else{
			$("#sidebar-labels").html(labels);
		}

        comment += '<br/><div>' + reportTime(report_time) + '</div>'
		$("#sidebar-comment").html(comment);

	}

    function reportTime (t){
        var date = t.substr(0, 4) + '/' + t.substr(4, 2) + '/' + t.substr(6, 2);
        var time = t.substr(8, 2) + ':' + t.substr(10, 2);
        return date + ' ' + time;
    }

	function setJMALink (code, layer){
		var pcode = parseInt(code.substr(0, 2)), fcode;
		if (pcode == 1){
			fcode = "0" + code.substr(2, 1);
		}else if (pcode == 47){
			fcode = 53 + parseInt(code.substr(3,1));
		}else{
			var jma_pref_code = [
				8, 10, 12, 9, 11, 13, 14, 16, 15, 17, 18, 19, 20, 23, 24, 25, 26, 21, 22, 
				28, 27, 29, 30, 34, 33, 31, 32, 35, 36,
				39, 38, 40, 38, 45, 43, 41, 42, 44,
				46, 47, 48, 49, 50, 51, 52
			];
			fcode = ("0" + jma_pref_code[pcode - 2]).slice(-2);
		}

		if (layer == "pref"){
			$("#jma-link a").attr("href", "http://www.jma.go.jp/jp/warn/3" + fcode + ".html");
		}else if (layer == "city"){
			$("#jma-link a").attr("href", "http://www.jma.go.jp/jp/warn/f_" + code.substr(0, 6) + "0.html"); 
		}else{
			$("#jma-link a").attr("href", "http://www.jma.go.jp/jp/warn/3" + fcode + "_table.html#" + code);
		}
	}

	function warningLabel (warning_str){
		if (warning_str.substr(-3) == '注意報'){
			return '<a class="ui yellow label">' + warning_str.slice(0, -3) + '</a>';
		}else if (warning_str.substr(-4) == '特別警報'){
			return '<a class="ui violet label">' + warning_str.slice(0, -4) + '</a>';
		}else if (warning_str.substr(-2) == '警報'){
			return '<a class="ui red label">' + warning_str.slice(0, -2) + '</a>';
		}
	}

});
