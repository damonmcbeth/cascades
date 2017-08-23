(function() {
    'use strict';

    angular
        .module('app')
        .controller('FileUploadController', FileUploadController);

    FileUploadController.$inject = ['$scope', 'globalSettings', 'storageService'];

    function FileUploadController($scope, globalSettings, storageService) {
        var ctrl = this;
				
		$scope.showProgress = false;
		var progress = $('#progressBar');
		
		ctrl.onChange = function onChange(loc, fileList, uploadCtrl) {
			var file = fileList[0];
			
			if (file != null) {
				//$scope.showProgress = true;
				console.log(progress);
				progress.removeClass('ng-hide');
				
				storageService.uploadFile(loc, file).then(
					function(result) {
						progress.addClass('ng-hide');
				})
			}
    	}
    	
    }
}());