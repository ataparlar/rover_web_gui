mapboxgl.accessToken = 'pk.eyJ1IjoiZGVrc3ByaW1lIiwiYSI6ImNqOGsxb3dyYzA4b2wyeHBsdGx0aXdzeHYifQ.4vYgxeGhICEGWbC1552LsQ';

var ros_server_url = document.location.hostname + ":9090";

var ros = new ROSLIB.Ros(); // websocket için gerekli.

var rosConnected = false; //control variable
var prevControl = new Array();

//map style 'Ları burada tanımlanıyor-----
var itu_map_bound = new mapboxgl.LngLatBounds([29.012778611801405, 41.094110180449768], [29.040779718268116, 41.1139016927532]); // sol alt köşesinden sağ üst köşesine. sınırlar burası.
var itu_map = { // GEOJSON - Lat Long bulundurur.
    "version": 8,
    "sources": {
        "itu_map_tile": {
            "type": "raster",
            // "url": "mapbox://map-id"
            //"url": location.origin+location.pathname+"itu-ayazaga"
            "tiles": [location.origin + "/maps/itu-ayazaga/{z}/{x}/{y}.pbf"],
            //"maxzoom": 19,
            //"minzoom": 14,

        }
    },
    "layers": [{
        "id": "itu_map_tile",
        "type": "raster",
        "source": "itu_map_tile",
        "minzoom": 0,
        "maxzoom": 19
        }]
};

var itu_GM_map_bound = new mapboxgl.LngLatBounds([29.014913, 41.099879], [29.030737, 41.108071]);
var itu_GM_map = {
    "version": 8,
    "sources": {
        "itu_GM_map_tile": {
            "type": "raster",
            // "url": "mapbox://map-id"
            //"url": location.origin+location.pathname+"itu-ayazaga"
            "tiles": [location.origin + "/maps/itu_ayazaga_GM/{z}/{x}/{y}.png.tile"],
            //"maxzoom": 19,
            //"minzoom": 14,

        }
    },
    "layers": [{
        "id": "itu_GM_map_tile",
        "type": "raster",
        "source": "itu_GM_map_tile",
        "minzoom": 0,
        "maxzoom": 19
        }]
};

var itu_GM_sat_map_bound = new mapboxgl.LngLatBounds([29.014913, 41.099879], [29.030737, 41.108071]);
var itu_GM_sat_map = {
    "version": 8,
    "sources": {
        "itu_GM_sat_map_tile": {
            "type": "raster",
            // "url": "mapbox://map-id"
            //"url": location.origin+location.pathname+"itu-ayazaga"
            "tiles": [location.origin + "/maps/itu_ayazaga_GM_sat/{z}/{x}/{y}.jpg.tile"],
            //"maxzoom": 19,
            //"minzoom": 14,

        }
    },
    "layers": [{
        "id": "itu_GM_sat_map_tile",
        "type": "raster",
        "source": "itu_GM_sat_map_tile",
        "minzoom": 0,
        "maxzoom": 19
        }]
};


var utah_GM_map_bound = new mapboxgl.LngLatBounds([-110.798434, 38.401502], [-110.785805, 38.411034]);
var utah_GM_map = {
    "version": 8,
    "sources": {
        "utah_GM_map_tile": {
            "type": "raster",
            // "url": "mapbox://map-id"
            //"url": location.origin+location.pathname+"itu-ayazaga"
            "tiles": [location.origin + "/maps/UTAH_GM_comp_area/{z}/{x}/{y}.png.tile"],
            //"maxzoom": 19,
            //"minzoom": 14,

        }
    },
    "layers": [{
        "id": "utah_GM_map_tile",
        "type": "raster",
        "source": "utah_GM_map_tile",
        "minzoom": 0,
        "maxzoom": 19
        }]
};


//var utah_bing_sat_map_bound = new mapboxgl.LngLatBounds([-110.798434, 38.401502], [-110.785805, 38.411034]);
var utah_bing_sat_map = {
    "version": 8,
    "sources": {
        "utah_bing_sat_map_tile": {
            "type": "raster",
            "tiles": [location.origin + "/maps/UTAH_bing_comp_area_sat/{z}/{x}/{y}.jpg.tile"],
        }
    },
    "layers": [{
        "id": "utah_bing_sat_map_tile",
        "type": "raster",
        "source": "utah_bing_sat_map_tile",
        "minzoom": 0,
        "maxzoom": 19
    }]
};


var ui_variables = { // control değişkenleri oluşturuldu
    focused: false,
    editable: false,
    remove: false,
    move: false,
    add: false,
    target_index: null,
    marker_moving: false

}
var monument = [-110.791941, 38.406320, ];
var waypoints = new Array(); //stores marker_rs

//stores geojson markers
var markerDatas = {
    "type": "FeatureCollection",
    "features": [
    ]
};

//Define ros messages
var pos_msg = new ROSLIB.Message({ //position mesaj objesini oluşturdum.
    latitude: null,
    longitude: null
});
//-------------------------------------------------------------------------
//define publishers--
var position_publisher = new ROSLIB.Topic({ // rover_gps/waypoint ismindeki topicle eşleşir.
    ros: ros,
    name: 'rover_gps/waypoint',            //rover_gps/waypoint
    messageType: 'sensor_msgs/NavSatFix'
});
//----------------------------------------------
//define subscribers
var battery_listener = new ROSLIB.Topic({
    ros: ros,
    name: '/mavros/battery',
    messageType: 'sensor_msgs/BatteryState'
});

var state_listener = new ROSLIB.Topic({
    ros: ros,
    name: '/mavros/state',
    messageType: 'mavros_msgs/State'
});

var compass_hdg_listener = new ROSLIB.Topic({
    ros: ros,
    name: '/mavros/global_position/compass_hdg',
    messageType: 'std_msgs/Float64'
});

var local_odom_listener = new ROSLIB.Topic({
    ros: ros,
    name: '/mavros/local_position/odom',
    messageType: 'nav_msgs/Odometry'
});

var imu_listener = new ROSLIB.Topic({
    ros: ros,
    name: '/mavros/imu/data',
    messageType: 'sensor_msgs/Imu'
});
var gps_control_listener = new ROSLIB.Topic({
    ros: ros,
    name: 'gps/control',
    messageType: 'sensor_msgs/NavSatFix'
});
var gps_listener = new ROSLIB.Topic({
    ros: ros,
    name: 'gps/fix',
    messageType: 'sensor_msgs/NavSatFix'
});
//-------------------------------------------

var markerLineString = { //marker'lar arası çizilen çizgi


    "type": "Feature",
    "properties": {},
    "geometry": {
        "type": "LineString",
        "coordinates": [[], []
                    ]
    }
}

$(document).ready(function () {
    $("#marker-adder").hide();
    $("#edit-controls").hide();
    $("converter_section").hide();
});
var map = new mapboxgl.Map({ 
    container: 'map', // arkaplanı kaplayan haritanın container id'si
    style: 'mapbox://styles/mapbox/satellite-streets-v9', //haritanın alındığı yer
    center: [-110.791941, 38.406320, ], // haritanın merkezi
    zoom: 15 // görüneceği büyüklük
});

map.on('mousemove', function (e) {
	document.getElementById('info').innerHTML =
	// e.lngLat is the longitude, latitude geographical position of the event
	JSON.stringify(e.lngLat);
    //console.log(e.lngLat)
	});

map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
map.doubleClickZoom.disable();

// GeoJSON object to hold our measurement features
var geojson = { 
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "id": "id0",
        "geometry": {
            "type": "Point",
            "coordinates": [
                [parseFloat(document.getElementById("coord-lat").value), parseFloat(document.getElementById("coord-lng").value)]
            ],
        },
    }]
};

//GeoJson object for drone marker
var drone = {
    "type": "Point",
    "coordinates": monument
};
var rover = {
    "type": "Point",
    "coordinates": [0, 0]
};

//heading value fo drone marker
var direction;



function setRoverPos() {
    map.getSource('rover').setData(rover);

    //map.setLayoutProperty('drone', 'icon-rotate', direction);

    if (ui_variables.focused === true) {
        map.setCenter(rover.coordinates);
    }
}

ros.connect("ws://" + ros_server_url); //connected to ros

ros.on("connection", function () {
    console.debug("Connected to ROS server");
    rosConnected = true;
    initSubscribers();
    initPublishers();
});

ros.on("close", function () {
    console.debug("Disconnected from ROS server");
    rosConnected = false;
});

// Used to draw a line between points
//Added comments for Taha
var linestring = {
    "type": "Feature",
    "geometry": {
        "type": "LineString",
        "coordinates": []
    }
};

// create DOM element for the marker
// create the marker
map.on('click', function (e) { // uygun variable koşulları sağlandığında, tıkladığın yeri işaretle
    if (ui_variables.add && ui_variables.editable) {
        addMark([e.lngLat.lng, e.lngLat.lat]);
    }

});

map.on('mousemove', function (e) {
    if (ui_variables.move && ui_variables.editable && ui_variables.marker_moving) { // edit markers ve ekleme tuşlarına basılmış olması.
        moveMarker(ui_variables.target_index, [e.lngLat.lng, e.lngLat.lat]);
    }
});


//if you want to do realtime operations on map, use this
map.on('styledata', function () {
    //CREATES source for waypoints
    map.addSource('waypoints', {
        "type": 'geojson',
        "data": markerDatas
    });

    //creates source for lines
    map.addSource("lines", {
        "type": "geojson",
        "data": markerLineString
    });

    // add the GeoJSON above to a new vector tile source
    if (rosConnected) { 
        map.addSource('drone', {
            type: 'geojson',
            data: drone
        });
        map.addSource('rover', {
            type: 'geojson',
            data: rover
        });

        map.setCenter(drone.coordinates);

        map.addLayer({
            "id": "drone-glow-strong",
            "type": "circle",
            "source": "drone",
            "paint": {
                "circle-radius": 18,
                "circle-color": "#000",
                "circle-opacity": 0.4
            }
        });
        map.addLayer({
            "id": "rover-glow-strong",
            "type": "circle",
            "source": "rover",
            "paint": {
                "circle-radius": 18,
                "circle-color": "#549",
                "circle-opacity": 0.4
            }
        });


        map.addLayer({
            "id": "drone-glow",
            "type": "circle",
            "source": "drone",
            "paint": {
                "circle-radius": 40,
                "circle-color": "#392",
                "circle-opacity": 0.1
            }
        });
        map.addLayer({
            "id": "rover-glow",
            "type": "circle",
            "source": "rover",
            "paint": {
                "circle-radius": 40,
                "circle-color": "#000",
                "circle-opacity": 0.1
            }
        });

        map.addLayer({
            "id": "drone",
            "type": "symbol",
            "source": "drone",
            "layout": {
                "icon-image": "airport-15",
                "icon-rotation-alignment": "map"
            }
        });


        window.setInterval(setDronePos, 250);
    }
    //creates layer for waypoints
    map.addLayer({
        "id": "waypoint_layer",
        "type": "circle",
        "source": "waypoints",
        "paint": {
            "circle-radius": 26,
            "circle-color": "#000",
            "circle-opacity": 1
        }

    });

    //draws lines
    map.addLayer({
        "id": "route",
        "type": "line",
        "source": "lines",
        "layout": {
            "line-join": "round",
            "line-cap": "round"
        },
        "paint": {
            "line-color": "#b80909",
            "line-width": 8,
            "line-opacity": 0.6
        }

    });

});

function converter() {
    var degree = document.getElementById('deg').value;
    var minute = document.getElementById('min').value;
    var second = document.getElementById('sec').value;
    var longitude_i = document.getElementById('long').value;


    //alert(degree);
    longitude = parseFloat(degree) + parseFloat(minute / 60) + parseFloat(second / 3600);
    document.getElementById("outputLong").innerHTML = longitude;
    //alert(longitude);

    long_deg = Math.floor(longitude_i);
    document.getElementById("outputDeg").innerHTML = long_deg;

    long_min_i = 60 * (longitude_i - long_deg);

    long_min = Math.floor(long_min_i);


    document.getElementById("outputMin").innerHTML = long_min;

    long_sec = 60 * (long_min_i - long_min);

    document.getElementById("outputSec").innerHTML = long_sec;

}


function initPublishers() {
    position_publisher.publish(pos_msg);
}

//obtain data from ros
function initSubscribers() {

    //State
    //TODO Add Robostate /State topic
    //--Armed Status(True,False)
    //--Px4Mode(AUTO, OFFBOARD etc.)
    state_listener.subscribe(function (msg) {});
    //Battery
    //--Voltage(V)
    //--Percentage(%)
    //--Percentage bar design loader
    //--Current(A)
    //--Consumed(mAh)
    battery_listener.subscribe(function (msg) {});
    //Global
    //--Latitude (degrees)
    //--Longitude (degrees)
    //--Altitude (m)AMSL
    //TODO add artificial horizon
    gps_control_listener.subscribe(function (msg) {
        console.log(msg.data);
       // if( prevControl != [msg.longitude, msg.latitude]){
            prevControl = [msg.longitude, msg.latitude];
            rover.coordinates[1] = msg.latitude;
            rover.coordinates[0] = msg.longitude;
            setRoverPos();
        //}
    });
    gps_listener.subscribe(function (msg) {
        drone.coordinates[1] = msg.latitude;
        drone.coordinates[0] = msg.longitude;
        //console.log(drone.coordinates[1] + " " + drone.coordinates[0]); //Printing the gps coordinates to console
    });

    //--Compass heading
    compass_hdg_listener.subscribe(function (msg) {
        direction = msg.data;
    });
    //Local
    //--Position x, y, z (m)
    //--Orientation x, y, z, w (angle)(TODO convert to euler angles AND to degrees bc
    //--Velocity x, y, z, (m/s)
    local_odom_listener.subscribe(function (msg) {});
    //--Acceleration x, y, z (m/s/s)
    imu_listener.subscribe(function (msg) {

    });
}

//go to drone's location
jQuery("#go-to-rover").click(function () {
    map.setCenter(drone.coordinates);
});
jQuery("#add-rover").click(function () {
    map.setCenter(rover.coordinates);
});

$("#addMarkBtn").click(function () {
    var data = [Number($("#addMarkLng").val()), Number($("#addMarkLat").val())];
    addMark(data);
});

$("#edit-markers").click(function () {
    if (!ui_variables.editable) {
        initControl("#move-marker");
        initControl("#remove-marker");
        initControl("#add-marker");
        initControl("#remove-all-markers");
        ui_variables.add = false;
        ui_variables.move = false;
        ui_variables.remove = false;
    }
    ui_variables.editable = !ui_variables.editable;
    $("#marker-adder").slideToggle(500);

    $("#edit-controls").slideToggle(500);

});

$("#converter").click(function () {
    if (!ui_variables.editable) {
        initControl("#convert_section");

        ui_variables.add = false;
        ui_variables.move = false;
        ui_variables.remove = false;
    }
    ui_variables.editable = !ui_variables.editable;
    $("#convert").slideToggle(500);


});

$("#add-marker").click(function () {
    ui_variables.add = !ui_variables.add;
    $("#move-marker").slideToggle(500);
    $("#remove-marker").slideToggle(500);
    $("#remove-all-markers").slideToggle(500);

});

$("#move-marker").click(function () {
    if (!ui_variables.move) {
        map.dragPan.disable();
    } else {
        map.dragPan.enable();
    }
    ui_variables.move = !ui_variables.move;
    $("#add-marker").slideToggle(500);
    $("#remove-marker").slideToggle(500);
    $("#remove-all-markers").slideToggle(500);

});

$("#remove-marker").click(function () {
    ui_variables.remove = !ui_variables.remove;
    $("#add-marker").slideToggle(500);
    $("#move-marker").slideToggle(500);
    $("#remove-all-markers").slideToggle(500);

});

$("#map-online").click(function () {
    map.setStyle('mapbox://styles/mapbox/satellite-streets-v9');
    map.setCenter([-110.791941, 38.406320]);
    map.setMaxBounds(null);
});

$("#map-offline-1").click(function () {
    map.setStyle(itu_map);
    map.setCenter([29.02677916503476, 41.104005936601482]);
    map.setMaxBounds(itu_map_bound);
    map.setZoom(15);
});

$("#map-offline-2").click(function () {
    map.setStyle(itu_GM_map);
    map.setCenter([29.022825, 41.103975]);
    map.setMaxBounds(itu_GM_map_bound);
    map.setZoom(15);
});

$("#map-offline-3").click(function () {
    map.setStyle(itu_GM_sat_map);
    map.setCenter([29.022825, 41.103975]);
    map.setMaxBounds(itu_GM_sat_map_bound);
    map.setZoom(15);
});

$("#map-offline-4").click(function () {
    map.setStyle(utah_GM_map);
    map.setCenter([-110.792119, 38.406268]);
    //map.setMaxBounds(utah_GM_map_bound);
    map.setZoom(15);
});

$("#map-offline-5").click(function () {
    map.setStyle(utah_bing_sat_map);
    map.setCenter([-110.792119, 38.406268]);
    //map.setMaxBounds(utah_GM_sat_map_bound);
    map.setZoom(16);
});


$(document).on("click", ".waypoint", function (e) {
    if (ui_variables.remove && ui_variables.editable) {
        removeMarker(e.target);
    } else if (!ui_variables.editable && rosConnected == true) {
        var target_index = e.target.getAttribute("index");
        var target_pos = waypoints[target_index].coordinates;
        pos_msg.latitude = parseFloat( target_pos[0]);
        pos_msg.longitude = parseFloat( target_pos[1]);
        position_publisher.publish(pos_msg);
    }
});

$(document).on("mousedown", ".waypoint", function (e) {
    e.preventDefault();
    if (ui_variables.move && ui_variables.editable) {
        ui_variables.target_index = e.target.getAttribute("index");
        ui_variables.marker_moving = true;
    }
});

$(document).on("mouseup", ".waypoint", function (e) {
    if (ui_variables.move && ui_variables.editable) {
        ui_variables.target_index = null;
        ui_variables.marker_moving = false;
    }
});
/*
function addMark2() {
    var coord_lng = parseFloat(document.getElementById("coord-lng").value);
    var coord_lat = parseFloat(document.getElementById("coord-lat").value);
    marker_prototype.coordinates[0] = coord_lng;
    marker_prototype.coordinates[1] = coord_lat;
}       

    TRIED TO ADD ANOTHER FUNCTION TO ADD MARKER BUT NOT BUILDED IT WELL. THEN TRIED TO IMPROVE AT THE BOTTOM.

*/
function addMark(data) {
    //var marker_prototype = new marker_rs(data);
    var coord_lng = parseFloat(document.getElementById("coord-lng").value);
    var coord_lat = parseFloat(document.getElementById("coord-lat").value);
    var coord_ = [coord_lng, coord_lat]
    var marker_prototype = new marker_rs();
    markerDatas.features.push(marker_prototype.getFeature()); //geojson data. creates a bunch of points dynamically.
    waypoints.push(marker_prototype); //holds marker_rs objects ------------ waypoints are important
    console.log(marker_prototype); // marker_prototype.coordinates[0] = longtitude
    console.log(waypoints)
    console.log(geojson)



    /*
        System structure

            when the user clicks on the map:

            --a marker_rs object is created. every marker_rs object has a bunch of functions and variables.Most important ones are;
            id, coordinates and getFeature() function
            --this object is added to and of waypoints array.index of this object is referred as temp_index
            --id of the object is "waypoint-" + index.So the first marker will have an id of "waypoint-0"
            --geojson data extracted from this object is pushed to markerDatas.features[] array.
            --the geojson source "waypoints" watches markerDatas.İt automatically updates the points

            waypoint deleting procedure:

            --index of deleted marker will be held.
            -- waypoint will first be deleted from markerDatas Array, then from waypoints array and finally div object that has the correct "index" attribute.
            -- previous data will be shifted accordingly.
            --line data will be updated.
            --new data will be shown

            line drawing procedure:

    */
    var temp_index = waypoints.indexOf(marker_prototype);
    var el = document.createElement('div');
    if (temp_index == 0) {
        el.style.backgroundColor = "yellow";
    }
    waypoints[temp_index].marker_div = el;
    waypoints[temp_index].setIndex(temp_index);

    map.getSource("waypoints").setData(markerDatas); //this "waypoints" is not the array that marker_rs s are stored.It is name of the source.
    waypoints[temp_index].marker = new mapboxgl.Marker(el).setLngLat(data).addTo(map);
    updateLines();
}


function updateLines() {
    markerLineString.geometry.coordinates = [];
    for (i = 0; i < markerDatas.features.length; i++) {
        markerLineString.geometry.coordinates[i] = markerDatas.features[i].geometry.coordinates;
    }
    if (markerDatas.features.length < 2) {
        markerLineString.geometry.coordinates = [[], []];
    }
    map.getSource("lines").setData(markerLineString);
}

function removeMarker(element) {
    var idx = element.getAttribute("index");
    element.remove();
    waypoints.splice(idx, 1);
    markerDatas.features.splice(idx, 1);
    for (k = idx; k < markerDatas.features.length; k++) {
        waypoints[k].setIndex(k);
        waypoints[k].marker = new mapboxgl.Marker(waypoints[k].marker_div).setLngLat(waypoints[k].coordinates).addTo(map);
    }

    map.getSource("waypoints").setData(markerDatas);
    updateLines();
}

function moveMarker(idx, pos) {
    waypoints[idx].setPosition(pos);
    markerDatas.features[idx] = waypoints[idx].getFeature();
    waypoints[idx].marker.setLngLat(pos);
    map.getSource("waypoints").setData(markerDatas);
    updateLines();
}

function initControl(elm) {
    $(elm).removeClass("disabled");
    $(elm).show();
}
//TODO Add marker arrays
//TODO Add list items and connect them to markers
//TODO Align the map and the info box - look at the columns
//TODO Draw linestrings in between the markers
//TODO Find a way to store array elements and save them into a file within the server
//when it is submitted
//TODO Make the waypoint markers draggable
