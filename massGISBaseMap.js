(function initialize() {
    var serviceUrls = { 'topo_features'     :  "https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/MassGIS_Topographic_Features_for_Basemap/MapServer",
                        'basemap_features'  :  "https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/MassGIS_Basemap_Detailed_Features/MapServer",
                        'structures'        :  "https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/MassGIS_Structures/MapServer",
                        'parcels'           :  "https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/MassGIS_Level3_Parcels/MapServer"
                         };
    
    $.ajax({url: serviceUrls['topo_features'], jsonp: 'callback', dataType: 'jsonp', data: { f: 'json' },
            success: function(config) {               
                // Get resolutions
                var tileInfo = config.tileInfo;
                var resolutions = [];
                for (var i = 0, ii = tileInfo.lods.length; i < ii; ++i) {
                    resolutions.push(tileInfo.lods[i].resolution);
                }               
                // Get projection
                var epsg = 'EPSG:' + config.spatialReference.wkid;
                var units = config.units === 'esriMeters' ? 'm' : 'degrees';
                var projection = ol.proj.get(epsg) ? ol.proj.get(epsg) : new ol.proj.Projection({ code: epsg, units: units });                              
                // Get attribution
                var attribution = new ol.control.Attribution({ html: config.copyrightText });               
                // Get full extent
                var fullExtent = [config.fullExtent.xmin, config.fullExtent.ymin, config.fullExtent.xmax, config.fullExtent.ymax];
                
                var tileInfo = config.tileInfo;
                var tileSize = [tileInfo.width || tileInfo.cols, tileInfo.height || tileInfo.rows];
                var tileOrigin = [tileInfo.origin.x, tileInfo.origin.y];
                var urls;
                var suffix = '/tile/{z}/{y}/{x}';
                urls = [serviceUrls['topo_features'] += suffix];               
                var width = tileSize[0] * resolutions[0];
                var height = tileSize[1] * resolutions[0];     
                var tileUrlFunction, extent, tileGrid;               
                if (projection.getCode() === 'EPSG:4326') {
                    tileUrlFunction = function tileUrlFunction(tileCoord) {
                        var url = urls.length === 1 ? urls[0] : urls[Math.floor(Math.random() * (urls.length - 0 + 1)) + 0];
                        return url.replace('{z}', (tileCoord[0] - 1).toString()).replace('{x}', tileCoord[1].toString()).replace('{y}', (-tileCoord[2] - 1).toString());
                    };
                } else {
                    extent = [tileOrigin[0], tileOrigin[1] - height, tileOrigin[0] + width, tileOrigin[1]];
                    tileGrid = new ol.tilegrid.TileGrid({ origin: tileOrigin, extent: extent, resolutions: resolutions });
                }     

                // Layer 1 - topographic features
                var layerSource = new ol.source.XYZ({ attributions: [attribution], projection: projection,
                                                      tileSize: tileSize, tileGrid: tileGrid,
                                                      tileUrlFunction: tileUrlFunction, urls: urls });
                                  
                var layer1 = new ol.layer.Tile();
                layer1.setSource(layerSource);
                
                // We make the rash assumption that since this set of tiled basemap layers were designed to overlay one another,
                // their projection, extent, and resolutions are the same.
                
                // Layer 2 - basemap features
                urls = [serviceUrls['basemap_features'] += suffix];  
                var layerSource = new ol.source.XYZ({ attributions: [attribution], projection: projection,
                                                      tileSize: tileSize, tileGrid: tileGrid,
                                                      tileUrlFunction: tileUrlFunction, urls: urls });                                  
                var layer2 = new ol.layer.Tile();
                layer2.setSource(layerSource);
                
                 // Layer 3 - structures
                urls = [serviceUrls['structures'] += suffix];  
                var layerSource = new ol.source.XYZ({ attributions: [attribution], projection: projection,
                                                      tileSize: tileSize, tileGrid: tileGrid,
                                                      tileUrlFunction: tileUrlFunction, urls: urls });;
                var layer3 = new ol.layer.Tile();
                layer3.setSource(layerSource);               
                               
                // Layer 4 - parcels
                urls = [serviceUrls['parcels'] += suffix];
                var layerSource = new ol.source.XYZ({ attributions: [attribution], projection: projection,
                                                      tileSize: tileSize, tileGrid: tileGrid,
                                                      tileUrlFunction: tileUrlFunction, urls: urls });;
                var layer4 = new ol.layer.Tile();
                layer4.setSource(layerSource);  

                var map = new ol.Map({ layers: [layer1, layer2, layer3, layer4],
                                       target: 'map',
                                       view: new ol.View({
                                           resolutions: resolutions,
                                           projection: projection
                                       })
                    });
                map.getView().fit(fullExtent, map.getSize());
                map.getView().setZoom(9);
            }
    });
})();