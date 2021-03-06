angular.module('app').directive('fileicon', function() {
	
	var controller = [ '$scope', function($scope) {
		
		$scope.determineFileType = function(url) {
			var fName = url.match(/(.*)\??/i).shift().replace(/\?.*/, '').split('.').pop();
			return fName;
		}
		
		$scope.determineFileIcon = function(url, type) {
			var fName = $scope.determineFileType(url);
			var result = "icons8-document-75";
			
			if (type.startsWith("image")) {
				result = "icons8-image-file-75";
			} else if (type == "Folder") {
				result = "icons8-folder-75";
			} else if (type == "Folder-Locked") {
				result = "icons8-folder-75-2";
			} else {
				switch(fName) {
					case "doc":
					case "docx": result = "icons8-microsoft-word-75"; break;
					
					case "xls":
					case "xlsx": result = "icons8-microsoft-excel-75"; break;
					
					case "pdf": result = "icons8-pdf-75"; break;
					
					case "m4a":
					case "mp3": result = "icons8-video-file-75"; break;
					case "ppt": 
					case "pptx": result = "icons8-microsoft-powerpoint-75"; break;
					case "html": result = "icons8-website-75"; break;
					case "m4v":
					case "mp4": result = "icons8-video-file-75"; break;
					
				}
			}
			
			return 'assets/img/attachments/' + result + '.png';
		}
			
	}]
	
    return {
	    restrict: 'E',
	    scope: { size: '@', file: '=', showtitle: '@'},
        controller: controller,
        templateUrl: '/partials/fileicon.html'
    }
});