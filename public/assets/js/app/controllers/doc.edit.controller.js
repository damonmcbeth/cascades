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
        
        $scope.selectedFolder = null;
        $scope.selectedFolderSrc = null;
        
        $scope.isEdit = true;
        $scope.showHints = false;
	                    
        $scope.openDetails = function(folder) {
			if (folder == null) {
				$scope.isEdit = false;
				$scope.selectedFolder = docService.newFolder();
				
			} else {
				$scope.selectedFolderSrc = folder;
				docService.cloneFolder(folder, null).then(
					function(cloned) {
						$scope.selectedFolder = cloned;  	  
				});
			}
		}
		
        $scope.saveFolder = function(isValid) {
	        if (isValid) {
				docService.saveFolder($scope.selectedFolder, $scope.selectedFolderSrc);
	        	$scope.closeDetails();
	        } else {
		        $scope.showHints = true;
		        globalSettings.showErrorToast("Please correct errors before saving.");
	        }
        }
        
        $scope.cancelEdit = function() {
	        $scope.closeDetails();
        }
        
        $scope.deleteFolder = function() {
	        docService.deleteFolder($scope.selectedFolderSrc);
	        $scope.closeDetails();
        }
        
        $scope.closeDetails = function() {
	        $scope.selectedFolderSrc = null;
		    globalNav.hideSideEditForm();
        }
        
    	$scope.initAction = function() {	    	
	    	if (globalNav.action == globalNav.ACTION_FOLDER_EDIT_DETAILS
	    		&& globalNav.actionArg != null) {
		    	docService.findFolder(globalNav.actionArg).then(
		    		function(folder) {
		    			$scope.openDetails(folder);
		    	});
	    	} else if (globalNav.action == globalNav.ACTION_FOLDER_NEW) {
		    	$scope.openDetails(null);
	    	} 
	    	
	    	globalNav.clearAction();
    	}
    	
    	globalNav.registerEditController(globalNav.ACTION_FOLDER, $scope.initAction);
    	
    	$scope.initAction();
    }
}());