(function() {
    'use strict';

    angular
        .module('app')
        .controller('DocEditController', DocEditController);

    DocEditController.$inject = ['$scope', '$rootScope', '$state', '$q', '$filter', 'globalSettings', 
    	'globalNav', 'docService'];

    function DocEditController($scope, $rootScope, $state, $q, $filter, globalSettings, globalNav, docService) {
        $scope.$state = $state;
        $scope.gs = globalSettings;
        
        $scope.selectedFile = null;
		$scope.selectedFileSrc = null;
		$scope.selectedFolder = null;
		$scope.initSelectedFolder = null;
        
        $scope.isEdit = true;
		$scope.showHints = false;
		$scope.canSave = false;
	                    
        $scope.openDetails = function(file) {
			if (file == null) {
				$scope.isEdit = false;
				var tmp = docService.newFile();
				tmp.folder = $scope.initSelectedFolder;

				$scope.selectedFile = tmp;
				$scope.initFolder();
			} else {
				$scope.selectedFileSrc = file;
				docService.cloneFile(file, null).then(
					function(cloned) {
						$scope.selectedFile = cloned;  	 
						$scope.initFolder(); 
				});
			}
		}

		$scope.initFolder = function() {
			if ($scope.selectedFile.folder != null) {
				docService.findFolder($scope.selectedFile.folder).then(
					function(folder) {
						$scope.selectedFolder = folder;
					}
				)
			}
		}

		$scope.onFileUploaded = function(result) {
			//console.log(result);
			$scope.selectedFile.url = result.downloadURL;
			$scope.selectedFile.title = result.metadata.name;
			$scope.selectedFile.size = result.metadata.size;
			$scope.selectedFile.type = result.metadata.contentType;

			$scope.canSave = true;
		}
		
        $scope.saveFile = function(isValid) {
	        if (isValid) {
				docService.saveFile($scope.selectedFile, $scope.selectedFileSrc);
	        	$scope.closeDetails();
	        } else {
		        $scope.showHints = true;
		        globalSettings.showErrorToast("Please correct errors before saving.");
	        }
        }
        
        $scope.cancelEdit = function() {
	        $scope.closeDetails();
        }
        
        $scope.deleteFile = function() {
	        docService.deleteFile($scope.selectedFileSrc);
	        $scope.closeDetails();
        }
        
        $scope.closeDetails = function() {
	        $scope.selectedFileSrc = null;
		    globalNav.hideSideEditForm();
        }
        
    	$scope.initAction = function() {	    	
	    	if (globalNav.action == globalNav.ACTION_DOC_EDIT_DETAILS
	    		&& globalNav.actionArg != null) {
		    	docService.findFile(globalNav.actionArg).then(
		    		function(file) {
		    			$scope.openDetails(file);
		    	});
	    	} else if (globalNav.action == globalNav.ACTION_DOC_NEW) {
				$scope.initSelectedFolder = globalNav.actionArg;
		    	$scope.openDetails(null);
	    	} 
	    	
	    	globalNav.clearAction();
    	}
    	
    	globalNav.registerEditController(globalNav.ACTION_DOC, $scope.initAction);
    	
    	$scope.initAction();
    }
}());