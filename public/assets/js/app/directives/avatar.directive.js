angular.module('app').directive('avatar', function() {
	var controller = [ '$scope', 'globalSettings', 'firebase', '$firebaseStorage', 
		function($scope, globalSettings, firebase, $firebaseStorage) {
		
		$scope.imageUrl = "";
		
		$scope.determineImg = function() {
			var imgPath = globalSettings.pref.people.imagePath;
			var result =  imgPath + "empty-icon.png";
			
			if ($scope.img != null && $scope.type != undefined) {
				if ($scope.type == "Custom") {
					result = $scope.img;			
				} else {
					result = imgPath + $scope.img;
				}
			}
			
			return result;
			
		}
			
	}]
	
    return {
	    restrict: 'E',
	    scope: { size: '@', img: '=', state: '=', name: '=', type: '='},
	    controller: controller,
        templateUrl: '/partials/avatar.html'
    }
});