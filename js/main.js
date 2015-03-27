var map;

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

function initialize() {
  var mapOptions = {
    center: { lat: -34.397, lng: 150.644},
    zoom: 8
  };
  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.MARKER,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        google.maps.drawing.OverlayType.POLYGON
      ]
    },
    polygonOptions: {
      fillColor: '#ff0000',
      fillOpacity: 0.33,
      clickable: false,
      zIndex: 1,
      editable: true,
      draggable: true
    }
  });

  google.maps.event.addListener(drawingManager, 'polygoncomplete', function(poly) {
    randomPoints = getPointsInPolygon(poly, 10);
    for (i = 0; i < randomPoints.length; ++i) {
      var marker = new google.maps.Marker({
          position: randomPoints[i],
          map: map,
          title: "A random point"
      });
    }
  });

  drawingManager.setMap(map);
}
google.maps.event.addDomListener(window, 'load', initialize);
