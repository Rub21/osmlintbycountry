'use strict';
var fs = require('fs');
var turf = require('turf');
var rbush = require('rbush');
var cover = require('tile-cover');
var argv = require('minimist')(process.argv.slice(2));
var iso3 = require('./data/countries.json');

var countries = JSON.parse(fs.readFileSync('data/countries.geojson', 'utf8'));
var limits = {
  min_zoom: 11,
  max_zoom: 11
};
var bbox_contries = [];
for (var i = 0; i < countries.features.length; i++) {
  if (iso3[countries.features[i].properties.ISO3]) {
    var countryGeom = countries.features[i].geometry;
    var tiles = cover.geojson(countryGeom, limits);
    for (var k = 0; k < tiles.features.length; k++) {
      var polygon = turf.featurecollection([tiles.features[k]]);
      var extent = turf.extent(polygon);
      bbox_contries.push(extent);
    }
  }
}
var rows = fs.readFileSync(argv.file, 'utf8').split('\n');
var points = [];
for (var i = 1; i < rows.length - 1; i++) {
  var row = rows[i].replace('"POINT(', '').replace(')"', '');
  var coor = row.split(' ').map(Number);
  var extentPoint = turf.extent(turf.point(coor));
  extentPoint.push(rows[i]);
  points.push(extentPoint);
}
var rTree = rbush(points.length);
rTree.load(points);
console.log('"geom"');
for (var i = 0; i < bbox_contries.length; i++) {
  var overlaps = rTree.search(bbox_contries[i]);
  for (var j = 0; j < overlaps.length; j++) {
    console.log(overlaps[j][4]);
  }

}