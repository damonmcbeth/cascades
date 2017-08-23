angular.module('app').directive('postrenderAction', ['$timeout', function ($timeout) {
    return {
	    restrict: 'A',
	    priority: 101,
        link: function (scope, element, attrs) {
				$timeout(function() {
			            scope.$evalAsync(attrs.postrenderAction);
			        }, 0);
      			}
    }
}]);