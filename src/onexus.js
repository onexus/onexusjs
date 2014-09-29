'use strict';

var onexus = angular.module('onexus', []);

onexus.directive('onexus.chart', function() {
    return {
        restrict: 'E',
        template: '<div></div>',
        scope: {
            chartData: "=value",
            chartObj: "=?"
        },
        transclude: true,
        replace: true,
        link: function($scope, $element, $attrs) {

            //Update when charts data changes
            $scope.$watch('chartData', function(value) {
                if (!value)
                    return;

                var update = function (data) {
                    // use default values if nothing is specified in the given settings
                    data.chart.renderTo = data.chart.renderTo || $element[0];
                    $scope.chartObj = new Highcharts.Chart(data);
                };

                if (typeof(value.then) === "function" ) {
                    value.then( update );
                } else {
                    update(value);
                }

            });
        }
    };

});

// Configure elastic search service
onexus.service('onexus.es', function (esFactory) {
     return esFactory({
       host: window.location.origin + '/es'
     });
});

onexus.service('onexus.service', [ '$q', 'onexus.es', 'onexus.collections', function ($q, es, collections) {

    var Selection = function(config) {

        var items = [];

        this.list = function() {
            return items;
        };

        this.add = function(item) {
            items.push(item);
        };

        this.has = function(type) {
            var i;
            for (i=0; i < items.length; i++) {
                if (items[i].type == type) {
                    return true;
                }
            }
            return false;
        };

        this.isEmpty = function() {
            return items.length == 0;
        };

        this.toString = function(type) {
            var strings = [];
            var i;
            for (i=0; i < items.length; i++) {
                if (type == undefined || items[i].type == type) {
                    strings.push(items[i].title);
                }
            }
            return strings.join(" & ");
        };

        this.decode = function (filter) {

            var hashConfig = {};
            angular.forEach(config, function(e) {
                hashConfig[e.type] = e;
            });

            items = [];

            if (filter != null && filter != '') {
                filter.split('::').forEach(function(type) {
                    var values = type.split('=');
                    items.push({ 'type': values[0], 'key': values[1], 'title': values[2], 'config': hashConfig[values[0]]});
                });
            }
        };

        this.encode = function (exclude) {

            var types = [];
            items.forEach(function(entity) {
                if (exclude == undefined || entity.type != exclude.type || entity.key != exclude.key) {
                    types.push(entity.type + '=' + entity.key + '=' + entity.title);
                }
            });

            return types.join('::');
        };

        this.search = function(value) {

                var result = $q.defer();
                var request = { body: [] };

                // Build request query
                angular.forEach(config, function(entity) {
                    request.body.push({ 'index': collections[entity.collection], 'type': 'entity'});
                    var conditions = { 'query' : { 'bool': { 'should' : [] }}, from: 0, size: 50 };
                    angular.forEach(entity.fields, function(field, position) {
                        var boost = 1 / (position + 1);
                        var obj = {}; obj[field] = { 'value': value.toLowerCase(), 'boost': boost };
                        conditions.query.bool.should.push({ 'prefix': obj });
                    });
                    request.body.push(conditions);
                });

                console.debug(request);

                es.msearch(request).then(function (resp) {

                        console.debug(resp);

                        var hits = [];
                        var i;
                        for (i=0; i < config.length; ++i) {
                            angular.forEach(resp.responses[i].hits.hits, function(item) {
                                hits.push({
                                    'collection': config[i].collection,
                                    'id': item._id,
                                    'type': config[i].type,
                                    'title': item._source[config[i].label],
                                    'key': item._source[config[i].key],
                                    'config': config[i]
                                 });
                            });
                        }

                        result.resolve(hits);
                    }, function (err) {
                        console.trace(err.message);
                        result.fail(err.message);
                    });
                return result.promise;
        };

        // PRIVATE METHODS DO NOT USE
        this._es_filter = function(mainCollection) {

            var filter = { bool: { must: [] }};

            angular.forEach(items, function(item) {
                var value = {};
                var field = (collections[item.config.collection] == mainCollection ? item.config.key : collections[item.config.collection] + "." + item.config.key);
                value[field] = item.key;
                filter.bool.must.push({ match: value });
            });

            return filter;
        };

    };

    var OnexusService = function() {

        this.create = function (config) {
            return new Selection(config);
        };

        this.query = function(collection, selection, params) {
            var params = typeof params !== "undefined" ? params : {};
            var total = typeof params.total !== "undefined" ? params.total : false;
            var size = typeof params.size !== "undefined" ? params.size : (total ? 10 : 1000);
            var from = typeof params.from !== "undefined" ? params.from : 0;

            var result = $q.defer();
            var indexName = collections[collection];

            var query;

            if (typeof selection === "undefined") {
                query = {
                    index: indexName,
                    body: {
                        query: { bool: { must: [{match_all:{}}] } },
                        size: size,
                        from: from
                    }
                };
            } else {
                query = {
                      index: indexName,
                      body: {
                            query: selection._es_filter(indexName),
                            size: size,
                            from: from
                      }
                };
            }

            if (typeof params.sort !== "undefined") {
                query.body['sort'] = params.sort;
            }

            console.debug(query);

            es.search(query).then(function (response) {
                console.debug(response);
                if (total) {
                    result.resolve(response.hits);
                } else {
                    result.resolve(response.hits.hits);
                }
            });

            return result.promise;
        };
    };

    return new OnexusService();
}]);

