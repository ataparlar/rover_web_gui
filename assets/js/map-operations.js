//this class is being written to simplify future data storage attempts and to ensure semanticity of 
// the code. map-operations.js only includes special constructor functions to be used with mapbox-gl.js library. Constructor functions does not 
// contain any mapboxgl functions.They only contain the needed data, functions to manipulalate this data and create html pieces.

var marker_rs = function (features) {
    this.index = 0;
    this.setIndex = function(idx){
        this.index = idx;
    }
    this.id = null;
    
    this.coordinates = [features.coordinates.lng, features.coordinates.lat];
    
    this.setPosition = function(pos){
        this.coordinates = pos;
    }
    
    this.altitude = 0;
    
    this.setAltitude = function(alt){
        this.altitude = alt;
    }
    
    this.direction = 0;
    
    this.setDirection = function(dir){
        this.direction = dir;
    }
    this.comment = " nothing is true, everything is permitted.";
    
    this.setComment = function(cmt){
        this.comment = cmt;
    }
    
    this.icon_path = "./images/logo.png";
    
    this.setIcon = function (path){
        this.icon_path = path;
    }
    
    this.getFeature = function(){
        return {
            "type" : "Feature",
            "properties" : {
                "iconSize" : [40, 40],
                "message" : this.comment
            },
            "geometry" :{
                "type" : "Point",
                "coordinates" : this.coordinates
            }
        }
    },
    
    this.marker_div = null;
    
}
/* marker_rs*/