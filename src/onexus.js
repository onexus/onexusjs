'use strict';

angular.module('onexus', []).directive('chart', function() {
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
