window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-ZL8HPL24E7');

            var map = L.map('map', {
                center: [38.333039, 140.26570],
                zoom: 6,
                minZoom: 2,
                scrollWheelZoom: false,
                smoothWheelZoom: true
            });
            var PolygonLayer_Style_1 = {
                "fillColor": "#454545",
                "color": "#ffffff",
                "weight": 0.8,
                "opacity": 1,
                "fillOpacity": 1,
            }
            var PolygonLayer_Style_2 = {
                "color": "#ffffff",
                "weight": 1.5,
                "opacity": 1,
                "fillColor": "#3a3a3a",
                "fillOpacity": 1,
            }
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
            Cookies.remove('before_center');
            var japan; //都道府県
            var asia; //アジア地域高品質ポリゴン 
            var countries; //アジア地域を除く世界の低品質ポリゴン  
            var cities; //市区町村
            var japan_data; //都道府県データ
            var asia_data; //アジア地域高品質ポリゴンデータ 
            var countries_data; //アジア地域を除く世界の低品質ポリゴンデータ
            var cities_data; //市区町村データ
            var japan_back;
            $.getJSON("../EqMap/Ver4/source/World.geojson", function (data) {
                asia_data = data;
                asia = L.geoJson(asia_data, {
                    pane: "shindo30",
                    style: PolygonLayer_Style_2,
                }).addTo(map);
            });
            $.getJSON("https://miyakocam.github.io/geojsons/saibun.geojson", function (data) {
                japan_data = data;
                japan = L.geoJson(japan_data, {
                    pane: "shindo30",
                    style: PolygonLayer_Style_1,
                }).addTo(map);
            }); 
            
            var QuakeJson;
            var JMAPointsJson;
            var maxint;
            var shingen_icon;
            var shindo_layer = L.layerGroup();
            var shindo_filled_layer = L.layerGroup();
            var Filled;
            var test_on = "test_off";
            var shingen_lnglat;
            var fly_shingen_lnglat;
            var fly_shingen_lnglat_2;
            var gettime;
            var autoreload_onoff;
            var autoreload_onoff_num;
            var autoreload_interval;
            var icon_theme = "eqm";
            var this_theme = "nerv";
            var data_japan;
            var filled_list = {};
            var allList = L.layerGroup();
            var typhoonTextList = L.layerGroup();
            var point_onoff = 1; //0:off, 1:on
            var fill_onoff = 1; //0:off, 1:on
            var info = document.getElementById('info');
            var list = document.getElementById('typhoonlist');
            var Test_typhoonList;
            var Test_Json;
            var Test_T_DATA;
            var Test_element;
            var i1; var i2; var i3; var i4; var i5; var i6; var i7; var i8;
            var yokuwakarantokonoi;
            list.onchange = event => {
                console.log(list.selectedIndex);
                infoWrite(list.selectedIndex);
            }

            function getData(already) {
            map.removeLayer(allList);
            allList = L.layerGroup();
            map.removeLayer(typhoonTextList);
            typhoonTextList = L.layerGroup();
            if (already == true || already == "true") {
                while (list.lastChild) {
                        list.removeChild(list.lastChild);
                }
                Test_typhoonList.forEach(element => {
                tropicalCyclone = element["tropicalCyclone"];
                Test_element = element;
                drawData();
                });
            } else {
                $.when(
                $.getJSON("https://www.jma.go.jp/bosai/typhoon/data/targetTc.json")
                // $.getJSON("source/targetTc.json")
                ).done(function (typhoonList) {
                    if (typhoonList == "") {
                        document.getElementById('noinfo').classList.add('display');
                        document.getElementById('btns').style.display = "none";
                        document.getElementById('info').style.display = "none";
                        document.getElementById('map').style.width = "100%";
                        document.getElementById('footer').style.left = "0";
                        map.panTo([38.333039, 132.670898]);
                        return;
                    } else {
                        document.getElementById('noinfo').classList.remove('display');
                        document.getElementById('info').style.display = "";
                    }
                    while (list.lastChild) {
                        list.removeChild(list.lastChild);
                    }
                    Test_typhoonList = typhoonList;
                    Test_typhoonList.forEach(element => {
                    tropicalCyclone = element["tropicalCyclone"];
                    $.when(
                        $.getJSON("https://www.jma.go.jp/bosai/typhoon/data/"+tropicalCyclone+"/forecast.json"),
                        // $.getJSON("source/typhoon.json"),
                        $.getJSON("https://www.jma.go.jp/bosai/typhoon/data/"+tropicalCyclone+"/specifications.json")
                        // $.getJSON("source/specifications.json"),
                        ).done(function (Json, T_DATA) {
                            Test_Json = Json;
                            Test_T_DATA = T_DATA;
                            Test_element = element;
                            drawData();
                        }
                    )
                    });
                }
                )
            }
            }

            function drawData(whiledisplayOnOff) {

                if (Test_T_DATA[0][0]["typhoonNumber"]) {
                    if (isNaN(Test_T_DATA[0][0]["typhoonNumber"]) == false) {T_number = '第' + Number(Test_T_DATA[0][0]["typhoonNumber"].substring(2,4)) + '号';} 
                    else {T_number = Test_T_DATA[0][0]["typhoonNumber"];}
                }
                T_time = Test_T_DATA[0][0]["issue"]["JST"] ? Test_T_DATA[0][0]["issue"]["JST"] : '-';
                T_name = Test_T_DATA[0][0]["name"] ? Test_T_DATA[0][0]["name"]["jp"] : '-';
                T_name_en = Test_T_DATA[0][0]["name"] ? Test_T_DATA[0][0]["name"]["en"] : '-';
                T_category = Test_T_DATA[0][1]["category"] ? Test_T_DATA[0][1]["category"]["jp"] : '-';
                T_scale = Test_T_DATA[0][1]["scale"] ? Test_T_DATA[0][1]["scale"] : '-';
                T_intensity = Test_T_DATA[0][1]["intensity"] ? Test_T_DATA[0][1]["intensity"] : '-';
                T_location = Test_T_DATA[0][1]["location"] ? Test_T_DATA[0][1]["location"] : '-';
                T_course = Test_T_DATA[0][1]["course"] ? Test_T_DATA[0][1]["course"] : '-';
                T_speed = Test_T_DATA[0][1]["speed"] ? Test_T_DATA[0][1]["speed"]["km/h"] ? Test_T_DATA[0][1]["speed"]["km/h"]+'km/h' : Test_T_DATA[0][1]["speed"]["note"] ? Test_T_DATA[0][1]["speed"]["note"]["jp"] : '-' : '-';
                T_pressure = Test_T_DATA[0][1]["pressure"] ? Test_T_DATA[0][1]["pressure"] : '-';
                T_maximumWind_sustained = Test_T_DATA[0][1]["maximumWind"] ? Test_T_DATA[0][1]["maximumWind"]["sustained"]["m/s"] : '-';
                T_maximumWind_gust = Test_T_DATA[0][1]["maximumWind"] ? Test_T_DATA[0][1]["maximumWind"]["gust"]["m/s"] : '-';

                nowcastDate = new Date();
                let nowcastyear = nowcastDate.getFullYear();
                let nowcastmonth = ('0' + (nowcastDate.getMonth() + 1)).slice(-2);
                let nowcastday = ('0' + nowcastDate.getDate()).slice(-2);
                let nowcasthour = ('0' + nowcastDate.getHours()).slice(-2);
                let nowcastminute = ('0' + nowcastDate.getMinutes()).slice(-2);
                let nowcastsecond = ('0' + nowcastDate.getSeconds()).slice(-2);
                let info1 = T_category+' '+T_number+' '+T_name+'('+T_name_en+')';

            if (T_category == "熱帯低気圧") {
                document.getElementById('tc').style.display = "block";
                document.getElementById('tcscale').style.display = "none";
                document.getElementById('tcintensity').style.display = "none";
                document.getElementById('tcms').style.display = "none";
                document.getElementById('tcmg').style.display = "none";
                document.getElementById('br1').style.display = "none";
                document.getElementById('br2').style.display = "none";
            }
            else {
                document.getElementById('tc').style.display = "";
                document.getElementById('tcscale').style.display = "";
                document.getElementById('tcintensity').style.display = "";
                document.getElementById('tcms').style.display = "";
                document.getElementById('tcmg').style.display = "";
                document.getElementById('br1').style.display = "";
                document.getElementById('br2').style.display = "";
            }

            const warn = new URLSearchParams(window.location.search);
            if (warn.get("mode") === "tc") {
                document.getElementById('tc').style.display = "";
                document.getElementById('tcscale').style.display = "";
                document.getElementById('tcintensity').style.display = "";
                document.getElementById('tcms').style.display = "";
                document.getElementById('tcmg').style.display = "";
                document.getElementById('br1').style.display = "";
                document.getElementById('br2').style.display = "";
            }
            
            //タイトル
            var info = ''+T_category+''+T_number+'の進路情報';
            document.getElementById('title').innerText = info;
            
            //発表遅刻
            var info = ""+T_time+'';
            info = info.substring(5,7)+'月'+info.substring(8,10)+'日 '+info.substring(11,13)+'時'+info.substring(14,16)+'分';
            document.getElementById('time').innerText = info;
            //大きさ
            var info = ""+T_scale+""
            document.getElementById('scale').innerText = info;
            
            //強さ
            var info = ""+T_intensity+""
            document.getElementById('intensity').innerText = info;

            //中心
            var info = ""+T_location+""
            document.getElementById('location').innerText = info;

            //速さ
            var info = ""+T_course+' '+T_speed+""
            document.getElementById('course').innerText = info;

            //中心気圧
            var info = ""+T_pressure+"hPa"+"";
            document.getElementById('pressure').innerText = info;

            //最大風速
            var info = ""+T_maximumWind_sustained+"m/s"+"";
            document.getElementById('maximumWind_sustained').innerText = info;
            
            //熱帯低気圧
            var info = '台風'+T_number+''+T_name+' は熱帯低気圧になりました。';
            document.getElementById('tloss').innerText = info;

            //最大瞬間風速
            var info = ""+T_maximumWind_gust+"m/s"+"";
            document.getElementById('maximumWind_gust').innerText = info;

                localStorage.removeItem("info_"+Test_element["tropicalCyclone"]);
                console.log(Test_element["tropicalCyclone"]);
                localStorage.setItem("info_"+Test_element["tropicalCyclone"], info.innerHTML);
                var option = document.createElement("option");
                option.value = "info_" + Test_element["tropicalCyclone"];
                option.textContent = info1;
                option.selected = true;
                list.appendChild(option);

                J_center = Test_Json[0][1]["center"];
                let centerIcon = L.icon({
                    iconUrl: 'source/shingen.png',
                    iconSize: [30,30],
                    popupAnchor: [0,-40]
                });
                center_latlng = new L.LatLng(J_center[0], J_center[1]);
                center_marker = L.marker(center_latlng, { icon: centerIcon, pane: "shingen"}).addTo(allList);
                map.panTo(center_latlng); // 台風の位置にマップを移動
                Cookies.set('before_center', J_center);
                divText2 = L.divIcon({
                    html: '<div class="leaflet_datetext">現在</div>',
                    iconSize: [0,0],
                    iconAnchor: [-25, 14]
                });L.marker(center_latlng, {icon: divText2}).addTo(allList);

                if (Test_Json[0][1]["stormWarningArea"]) {
                    J_bofu_center = Test_Json[0][1]["stormWarningArea"]["arc"][0][0];
                    bofu_latlng = new L.LatLng(J_bofu_center[0], J_bofu_center[1]);
                    bofu_radius = Test_Json[0][1]["stormWarningArea"]["arc"][0][1];
                    bofu_radius_km = Math.round(bofu_radius/10000) * 10;
                    bofu_marker = L.circle(bofu_latlng, {pane: "shindo70", radius:bofu_radius, weight: 2, opacity:1,fillColor: "#990021",fillOpacity:0.7,color:"#ffffff"}).addTo(allList);
                    bofu_marker.bindTooltip('暴風域　風速25m/s以上<br>半径：'+bofu_radius_km+'km',{direction: "right"});
                }
                
                if (Test_Json[0][1]["galeWarningArea"]) {
                    J_kyofu_center = Test_Json[0][1]["galeWarningArea"]["center"];
                    kyofu_latlng = new L.LatLng(J_kyofu_center[0], J_kyofu_center[1]);
                    kyofu_radius = Test_Json[0][1]["galeWarningArea"]["radius"];
                    kyofu_radius_km = Math.round(kyofu_radius/10000) * 10;
                    kyofu_marker = L.circle(kyofu_latlng, {pane: "shindo20", radius:kyofu_radius, weight: 2, opacity:1,fillColor: "#ffff00",fillOpacity:0.2,color:"#ffff00"}).addTo(allList);
                    kyofu_marker.bindTooltip('強風域　風速15m/s以上<br>半径：'+kyofu_radius_km+'km',{direction: "right"});
                }
                
                J_typhoon_track = Test_Json[0][1]["track"]["typhoon"];
                typhoon_line = L.polyline(J_typhoon_track ,{pane: "shindo50", color: "#A7EBE6", opacity: 1, weight: 5}).addTo(allList);

                J_pre_typhoon_track = Test_Json[0][1]["track"]["preTyphoon"];
                pre_typhoon_line = L.polyline(J_pre_typhoon_track ,{pane: "shindo50", color: "#A7EBE6", opacity: 1, weight: 3, dashArray: "3 6"}).addTo(allList);

                howmuch = Test_Json[0].length;
                

                for (i = 1; i < howmuch; i++) {
                    console.log(i);
                    yokuwakarantokonoi = i;

                    let L_category = Test_T_DATA[0][i]["category"] ? Test_T_DATA[0][i]["category"]["jp"] : '-';
                    let L_intensity = Test_T_DATA[0][i]["intensity"] ? Test_T_DATA[0][i]["intensity"] : '-';
                    let L_location = Test_T_DATA[0][i]["location"] ? Test_T_DATA[0][i]["location"] : '-';
                    let L_course = Test_T_DATA[0][i]["course"] ? Test_T_DATA[0][i]["course"] : '-';
                    let L_speed = Test_T_DATA[0][i]["speed"] ? Test_T_DATA[0][i]["speed"]["km/h"] ? Test_T_DATA[0][i]["speed"]["km/h"]+'km/h' : Test_T_DATA[0][i]["speed"]["note"] ? Test_T_DATA[0][i]["speed"]["note"]["jp"] : '-' : '-';
                    let L_pressure = Test_T_DATA[0][i]["pressure"] ? Test_T_DATA[0][i]["pressure"] : '-';
                    let L_maximumWind_sustained = Test_T_DATA[0][i]["maximumWind"] ? Test_T_DATA[0][i]["maximumWind"]["sustained"]["m/s"] : '-';
                    let L_maximumWind_gust = Test_T_DATA[0][i]["maximumWind"] ? Test_T_DATA[0][i]["maximumWind"]["gust"]["m/s"] : '-';
                    i1 = L_category+' '+T_number+' '+T_name+'('+T_name_en+')';
                    i3 = '強　さ：'+L_intensity;
                    i4 = '中　心：'+L_location;
                    i5 = '速　さ：'+L_course+' '+L_speed;
                    i6 = '<span style="transform: scale(0.75, 1);width: 3em;white-space: nowrap;transform-origin: left center;display: inline-block;">中心気圧</span>：'+L_pressure+"hPa";
                    i7 = '<span style="transform: scale(0.75, 1);width: 3em;white-space: nowrap;transform-origin: left center;display: inline-block;">最大風速</span>：'+L_maximumWind_sustained+"m/s";
                    i8 = '<span style="transform: scale(0.5, 1);width: 3em;white-space: nowrap;transform-origin: left center;display: inline-block;">最大瞬間風速</span>：'+L_maximumWind_gust+"m/s";

                    if (Test_Json[0][i]["probabilityCircle"] && Test_Json[0][i]["probabilityCircle"]["tangent"]) {
                        drawSubText();
                    }
                    if (i == 1) {
                        center_marker.bindTooltip(i1+'<br>'+i3+'<br>'+i4+'<br>'+i5+'<br>'+i6+'<br>'+i7+'<br>'+i8 ,{direction: "left",className: "center_circle_tooltip", offset: [-30, 0]});
                    }
                }
                // allList.addTo(map);
            }

            function drawSubText(whiledisplayOnOff) {

                console.log('押されたよ～ん1');
                J_h_center = Test_Json[0][yokuwakarantokonoi]["center"];
                J_h_radius = Test_Json[0][yokuwakarantokonoi]["probabilityCircle"]["radius"];
                J_h_latlng = new L.LatLng(J_h_center[0], J_h_center[1]);
                center_circle = L.circle(J_h_latlng, {pane: "shindo50", zIndex: 50, radius:J_h_radius, weight: 4, opacity:1,color:"#ffffff", fillOpacity: 0, dashArray: "8 4",lineCap: "butt",lineJoin: "miter"}).addTo(allList);
                // J_h_marker.bindTooltip(Test_Json[0][yokuwakarantokonoi]["validtime"]["JST"]);
                J_h_line_latlng = Test_Json[0][yokuwakarantokonoi]["probabilityCircle"]["tangent"];
                L.polyline(J_h_line_latlng[0] ,{pane: "shindo50", color: "#ffffff", opacity: 1, weight: 4, dashArray: "8 4",lineCap: "butt",lineJoin: "miter"}).addTo(allList);
                L.polyline(J_h_line_latlng[1] ,{pane: "shindo50", color: "#ffffff", opacity: 1, weight: 4, dashArray: "8 4",lineCap: "butt",lineJoin: "miter"}).addTo(allList);

                L.circleMarker(J_h_latlng, {pane: "shindo40", radius:6, opacity:0,fillColor:"#ffffff", fillOpacity: 1})
                    .on('click', function(e) {
                        map.panTo(e.latlng);
                    })
                    .addTo(allList);
                before_center_mae = Cookies.get('before_center').split(',');
                before_center = new L.LatLng(before_center_mae[0], before_center_mae[1]);
                L.polyline( [before_center, J_h_center],{pane: "shindo40", color: "#ffffff", opacity: 1, weight: 3, dashArray: "6 3",lineCap: "butt",lineJoin: "miter"}).addTo(allList);
                Cookies.set('before_center', J_h_center);

                center_circle.bindTooltip(i1+'<br>'+i3+'<br>'+i4+'<br>'+i5+'<br>'+i6+'<br>'+i7+'<br>'+i8 ,{direction: "left",className: "center_circle_tooltip", offset: [-30, 0]});

                // if (whiledisplayOnOff != undefined) {
                    console.log('押されたよ～ん2');
                    var datetime; var datetime_text;
                    var textMatome = '<div class="leaflet_datetext">'; // これに集約
                    datetime = Test_Json[0][yokuwakarantokonoi]["validtime"]["JST"].split('T');
                    datetime[0] = datetime[0].split('-'); /*[0]:year, [1]:month, [2]:date*/
                    datetime[1] = datetime[1].split(':'); /*[0]:hour, [1]:minute, [2]:second+09:00*/
                    datetime_text = datetime[0][1]+'月'+datetime[0][2]+'日 '+datetime[1][0]+'時'+datetime[1][1]+'分';
                    console.log(datetime_text);
                    var settingsOnOffArray = ["datetime", "name", "intensity", "location", "speed", "pressure", "maximumWind_sustained", "maximumWind_gust"];
                    for (var index = 0; index < settingsOnOffArray.length; index++) {
                        eval('var onoff = document.getElementById("'+settingsOnOffArray[index]+'_whiledisplay").checked ? 1 : 0;');
                        // let onoff = document.getElementById('name_whiledisplay').checked ? 1 : 0;
                        // onoff 1=おん 0=オフ
                        if (onoff == 1) {
                            if (index == 0) { //日時がオンの時
                                textMatome += datetime_text;
                            } else if (index == 1) { //nameのときはそのまま
                                if (textMatome == '<div class="leaflet_datetext">') 
                                {eval('textMatome += i'+index+';');} 
                                else {eval('textMatome += "<br>"+i'+index+';');}
                            } else { //ほかのところは1たす
                                var indexPlus1 = index + 1;
                                if (textMatome == '<div class="leaflet_datetext">') 
                                {eval('textMatome += i'+indexPlus1+';');} 
                                else {eval('textMatome += "<br>"+i'+indexPlus1+';');}
                            }
                        }
                    }
                    textMatome += '</div>';
                    divText = L.divIcon({
                        html: textMatome,
                        iconSize: [0,0],
                        iconAnchor: [-30, 14]
                    });
                    L.marker(J_h_latlng, {icon: divText}).addTo(typhoonTextList);
                /*
                } else {
                    var datetime; var datetime_text;
                    datetime = Test_Json[0][yokuwakarantokonoi]["validtime"]["JST"].split('T');
                    datetime[0] = datetime[0].split('-'); // [0]:year, [1]:month, [2]:date
                    datetime[1] = datetime[1].split(':'); // [0]:hour, [1]:minute, [2]:second+09:00
                    datetime_text = datetime[0][1]+'月'+datetime[0][2]+'日 '+datetime[1][0]+'時'+datetime[1][1]+'分';

                    divText = L.divIcon({
                        html: '<div class="leaflet_datetext">'+datetime_text+'</div>',
                        iconSize: [0,0],
                        iconAnchor: [-30, 14]
                    });
                    L.marker(J_h_latlng, {icon: divText}).addTo(typhoonTextList);
                }
                */

                // typhoonTextList.addTo(map);
            }

            getData();
            allList.addTo(map);
            typhoonTextList.addTo(map);
            setInterval(() => {
                getData();
                allList.addTo(map);
                typhoonTextList.addTo(map);
            }, 300000);


            function infoWrite(index) {
                let id = list[index]["value"];
                let naiyo = localStorage.getItem(id);
                info.innerHTML = naiyo;
            }

            document.getElementById('whiledisplay_open').addEventListener("click",()=>{
                document.getElementById('whiledisplay').classList.add('display');
            });
            document.getElementById('whiledisplay_close').addEventListener("click",()=>{
                document.getElementById('whiledisplay').classList.remove('display');
            });
            
            document.getElementById('tekiyou_whiledisplay').addEventListener("click",()=>{
                getData(true);
                allList.addTo(map);
                typhoonTextList.addTo(map);
                document.getElementById('whiledisplay').classList.remove('display');
            });