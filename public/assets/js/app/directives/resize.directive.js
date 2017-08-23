angular.module('app').directive('resize', ['$window', function ($window) {
    return function (scope, element) {
        var w = angular.element($window);
        var heightOffset = parseInt(element.attr('height-offset'));
        var widthOffset = parseInt(element.attr('width-offset'));
        var changeHeight = function () {
            if (!isNaN(heightOffset) && w.height() - heightOffset > 0)
                element.css('height', (w.height() - heightOffset) + 'px');
            if (!isNaN(widthOffset) && w.width() - widthOffset > 0)
                element.css('width', (w.width() - widthOffset) + 'px');
        };
        w.bind('resize', function () {
            changeHeight();
        });
        changeHeight();
    }
}]);