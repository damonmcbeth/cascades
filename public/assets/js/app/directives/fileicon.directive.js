angular.module('app').directive('fileicon', function() {
	
	var controller = [ '$scope', function($scope) {
		
		$scope.determineFileType = function(url) {
			var fName = url.match(/(.*)\??/i).shift().replace(/\?.*/, '').split('.').pop();
			return fName;
		}
		
		$scope.determineFileIcon = function(url) {
			var fName = $scope.determineFileType(url);
			var result = "file";
			
			
			switch(fName) {
				case "doc":
				case "docx": result = "doc"; break;
				
				case "xls":
				case "xlsx": result = "xls"; break;
				
				case "pdf": result = "pdf"; break;
				
				case "mp3": result = "music"; break;
				case "ppt": 
				case "pptx": result = "ppt"; break;
				case "html": result = "html"; break;
				case "mp4": result = "media"; break;
				 
			}
			
			return 'assets/img/attachments/' + result + '.png';
		}
			
	}]
	
    return {
	    restrict: 'E',
	    scope: { size: '@', file: '=', showtitle: '@'},
        controller: controller,
        templateUrl: '/seed/Partials/fileicon.html'
    }
});