// Create ramdom point features
const count = 20000;
const features = new Array(count);
const e = 4500000;
for (let i = 0; i < count; ++i) {
  const coordinates = [2 * e * Math.random() - e, 2 * e * Math.random() - e];
  features[i] = new ol.Feature(new ol.geom.Point(coordinates));
}


/*
Create and Render map on div with zoom and center
*/
let map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  view: new ol.View({
    center: [0, 0],
    zoom: 2,
  })
});

/*
Create Cluster Layer
*/
const styleCache = {};
let cluster_layer = new ol.layer.Vector({ 
  source: new ol.source.Cluster({
    distance: 35, 
    source: new ol.source.Vector({
      features: features,
      projection:map.getView().projection
    })
  }),  
  style: function (feature) {
    const size = feature.get('features').length;
    if (size == 1) {
      return new ol.style.Style({
        image: new ol.style.Circle({
          radius: 5,
          stroke: new ol.style.Stroke({
            color: [255, 255, 255, 1],
            width: 1,
          }),
          fill: new ol.style.Fill({
            color: [23, 153, 54, 1],
          }),
        })
      });
    }
    let style = styleCache[size];
    if (!style) {
      style = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 10,
          stroke: new ol.style.Stroke({
            color: [255, 255, 255, 0.7],
            width: 5,
          }),
          fill: new ol.style.Fill({
            color: [0, 153, 255, 0.7],
          }),
        }),
        text: new ol.style.Text({
          text: size.toString(),
          font: 'bold 12px serif',
          fill: new ol.style.Fill({
            color: [0, 0, 0, 1],
          }),
        }),
      });
      styleCache[size] = style;
    }
    return style;
  }
});

// Layer for mouse over
const highlight_layer = new ol.layer.Vector({
  title: "Highlight",      
  source: new ol.source.Vector({
    projection:map.getView().projection
  })
})

let parser = new jsts.io.OL3Parser();
// Display extent for each cluster on mouse over
map.on("pointermove", (e) => {
  highlight_layer.getSource().clear();
  cluster_layer.getFeatures(e.pixel).then((hoverFeatures) => {    
    if (hoverFeatures.length) {
      // Get clustered Coordinates
      const features = hoverFeatures[0].get('features');
      if (features.length > 1) {
        let geom_points = new ol.geom.MultiPoint(features.map((r) => r.getGeometry().getCoordinates()));        
        let convexHull = geom_points.convexHull();
        convexHull.push(convexHull[0]);
        let cluster_polygon = new ol.Feature(new ol.geom.Polygon([convexHull]));
        highlight_layer.getSource().addFeature(cluster_polygon);
      }
    }
  });
});

// Zoom to cluster on click
map.on('click', (e) => {
  cluster_layer.getFeatures(e.pixel).then((clickedFeatures) => {
    if (clickedFeatures.length) {
      // Get clustered Coordinates
      const features = clickedFeatures[0].get('features');
      if (features.length > 1) {        
        const extent = new ol.extent.boundingExtent(
          features.map((r) => r.getGeometry().getCoordinates())
        );        
        map.getView().fit(extent, {duration: 1000, padding: [50, 50, 50, 50]});
      }
    }
  });
});


  
map.addLayer(highlight_layer);
map.addLayer(cluster_layer);
