var map;
var drawingManager;
var searchArea;
var randomPoints = [];

function getPointsInPolygon(poly, n) {
  n = n || 1;

  // Construct logical rectangle containing entire polygon
  paths = _.map(poly.getPaths().getArray(), function(path) { return path.getArray(); });
  vertices = _.flatten(paths);
  lats = _.map(vertices, function(vertex) { return vertex.lat(); });
  lngs = _.map(vertices, function(vertex) { return vertex.lng(); });

  minLat = _.min(lats);
  maxLat = _.max(lats);
  minLng = _.min(lngs);
  maxLng = _.max(lngs);

  width = Math.abs(maxLng - minLng);
  height = Math.abs(maxLat - minLat);


  // Keep testing random points in the rectangle until we find n points inside the polygon or along its edges
  results = [];
  for (i = 0; i < n; ++i) {
    for (;;) {
      var testPoint = new google.maps.LatLng(minLat + Math.random() * height, minLng + Math.random() * width);
      if (google.maps.geometry.poly.containsLocation(testPoint, poly) ||
            google.maps.geometry.poly.isLocationOnEdge(testPoint, poly)) {
        results[results.length] = testPoint;
        break;
      }
    }
  }

  return results;
}

function deletePoints() {
  for (i = 0; i < randomPoints.length; ++i) {
    randomPoints[i].setMap(null);
  }
  randomPoints = [];
}

function resetArea() {
  deletePoints();
  searchArea.setMap(null);
  searchArea = null;
}

function addPoint() {
  randomPos = getPointsInPolygon(searchArea, 1)[0]
  randomPoints[randomPoints.length] = new google.maps.Marker({
    position: randomPos,
    map: map,
    title: "A random point",
    animation: google.maps.Animation.DROP,
    optimized: false
  });
}

function createMap(pos) {
  $("#map-canvas").html("");

  var mapOptions;
  if (pos != null) {
    mapOptions = {
      center: pos,
      zoom: 12
    };
  } else {
    mapOptions = {
      center: {lat: 0, lng: 0},
      zoom: 2
    }
  }

  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

  drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: true,
    drawingControlOptions: {
      drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      position: google.maps.ControlPosition.TOP_LEFT
    },
    polygonOptions: {
      fillColor: '#ff0000',
      fillOpacity: 0.33,
      clickable: false,
      zIndex: 1,
      editable: false,
      draggable: false,
      strokeWeight: 3
    }
  });

  google.maps.event.addListener(drawingManager, 'polygoncomplete', function(poly) {
    searchArea = poly;
    drawingManager.setDrawingMode(null);
    addPoint();
  });

  google.maps.event.addListener(drawingManager, 'drawingmode_changed', function() {
    drawingMode = drawingManager.getDrawingMode();
    if (drawingMode == google.maps.drawing.OverlayType.POLYGON) {
      resetArea();
    }
  });

  drawingManager.setMap(map);

  $(document).bind('keydown', function (event) {
    if (event.which == 32 && searchArea != null) {
      addPoint();
    }
  });
}

function initialize() {
  $('#instructions-modal').modal();
  $('#instructions-carousel').on('slide.bs.carousel', function (event) {
    if (event.direction == 'left' && event.relatedTarget.id == 'first-instruction-slide')
      $('#instructions-modal').modal('hide');
  });
  if (Modernizr.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        var center = new google.maps.LatLng(position.coords.latitude,
                                            position.coords.longitude);
        createMap(center);
      },
      function (error) {
        // Error
        console.log("Error getting location: " + error.message);
        createMap(null);
      },
      {
        maximumAge: 5 * 60 * 1000 // Accept cached values within last 5 minutes
      }
    );
  } else {
    createMap(null);
  }
}
google.maps.event.addDomListener(window, 'load', initialize);
