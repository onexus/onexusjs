'use strict';

var onexus = angular.module('onexus', []);

onexus.directive('chart', function() {
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

onexus.service('onexus.selection', function () {

    var Selection = function() {
        this.items = [];

        this.has = function(type) {
            var i;
            for (i=0; i < this.items.length; i++) {
                if (this.items[i].type == type) {
                    return true;
                }
            }
            return false;
        };

        this.isEmpty = function() {
            return this.items.length == 0;
        };

        this.toString = function() {
            var strings = [];
            angular.forEach(this.items, function(item) {
                strings.push(item.title);
            });
            return strings.join(" & ");
        };

        this.getFilter = function(mainIndex) {

            var filter = { bool: { must: [] }};

            angular.forEach(this.items, function(item) {
                var value = {};
                var field = (item.config.index == mainIndex ? item.config.key : item.config.index + "." + item.config.key);
                value[field] = item.title;
                filter.bool.must.push({ match: value });
            });

            return filter;
        };

    };

    var SelectionService = function() {

        this.create = function () {
            return new Selection();
        };

        this.decode = function (config, es, filter) {

            var hashConfig = {};
            angular.forEach(config, function(e) {
                hashConfig[e.type] = e;
            });

            var selection = [];

            if (filter != null && filter != '') {
                filter.split('::').forEach(function(type) {
                    var values = type.split('=');
                    selection.push({ 'type': values[0], 'title': values[1], 'config': hashConfig[values[0]]});
                });
            }

            return selection;
        };

        this.encode = function (config, selection) {

            var types = [];
            selection.forEach(function(entity) {
                types.push(entity.type + '=' + entity.title);
            });

            return types.join('::');
        };
    };

    return new SelectionService();
});

