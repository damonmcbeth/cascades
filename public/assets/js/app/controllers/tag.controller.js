(function() {
    'use strict';

    angular
        .module('app')
        .controller('TagController', TagController);

    TagController.$inject = ['$scope', '$rootScope', '$state', '$window', 'globalSettings', 
    	'globalNav', 'tagService', 'peopleService'];

    function TagController($scope, $rootScope, $state, $window, globalSettings, globalNav, tagService, peopleService) {
        $scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
        
        $scope.isEdit = false;
        
        tagService.getAllTags().then(
			function(tags) {
				$scope.tags = tags;
		});
        
        $scope.showDetails = false;	    
	    $scope.closeOnSave = false;
	    
        $scope.selectedTag = tagService.newTag();
        $scope.selectedTagSrc = null;
        
        $scope.maps = null;
        
        $scope.newTag = function() {
	        $scope.isEdit = false;
	        $scope.openDetails(null);
        }
        
        $scope.openDetails = function(tag) {
	        $scope.showDetails = true;
	        
	        if (tag == null){
		        $scope.selectedTag = tagService.newTag();
	        } else {
		        $scope.isEdit = true;
	        	$scope.selectedTagSrc = tag;
	        	$scope.selectedTag = tagService.cloneTag(tag, null);  
	        	    	
	        }
	        
			$("#custom").spectrum({ color:$scope.selectedTag.color, 
									showPaletteOnly: true,
									togglePaletteOnly: true,
									togglePaletteMoreText: 'more',
									togglePaletteLessText: 'less',
									palette: [
										["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
										["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
										["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
										["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
										["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
										["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
										["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
										["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
									],
									change: function(color){
												$scope.selectedTag.color= color.toHexString();}
								});
        }
        
		$scope.assignPerson = function(tag, uid, fld) {
			peopleService.findPerson(uid).then(
				function(person) {
					tag[fld] = person;
			});	
		};
        
        $scope.saveTag = function() {
	        tagService.saveTag($scope.selectedTag, $scope.selectedTagSrc);
	        $scope.selectedTagSrc = null;
	        $scope.selectedTag = tagService.newTag();
	        $scope.closeDetails();
        }
        
        $scope.cancelEdit = function() {
	        $scope.selectedTagSrc = null;
	        $scope.selectedTag = tagService.newTag();
	        $scope.closeDetails();
        }
        
        $scope.deleteTag = function() {
	        tagService.deleteTag($scope.selectedTagSrc);
	        $scope.closeDetails();

        }
        
        $scope.closeDetails = function() {
	        $scope.showDetails = false;
        }
        
        $scope.isIndeterminate = function() {
		    return (!$scope.isChecked() && !$scope.isUnChecked());
		};
		
		$scope.isChecked = function() {
		    return ($scope.selectedTag.forJournal && $scope.selectedTag.forPeople && 
		    		$scope.selectedTag.forProject && $scope.selectedTag.forTasks);
		};
		
		$scope.isUnChecked = function() {
		    return (!$scope.selectedTag.forJournal && !$scope.selectedTag.forPeople && 
		    		!$scope.selectedTag.forProject && !$scope.selectedTag.forTasks);
		};
		
		$scope.toggleAll = function() {
			var currState = $scope.isChecked();
			
		    $scope.selectedTag.forJournal = !currState; 
		    $scope.selectedTag.forPeople = !currState;  
		    $scope.selectedTag.forProject = !currState; 
		    $scope.selectedTag.forTasks = !currState; 
		};
		
		$scope.toggleJournal = function() {
		    $scope.selectedTag.forJournal = !$scope.selectedTag.forJournal;
		};
		
		$scope.togglePeople = function() {
		    $scope.selectedTag.forPeople = !$scope.selectedTag.forPeople;
		};
		
		$scope.toggleProject = function() {
		    $scope.selectedTag.forProject = !$scope.selectedTag.forProject; 
		};
		
		$scope.toggleTasks = function() {
		    $scope.selectedTag.forTasks = !$scope.selectedTag.forTasks; 
		};
	    
    	$scope.initAction = function() {
	    	//if (globalNav.action == globalNav.ACTION_TAG_SETTINGS_OPEN_DETAILS
	    	//	&& globalNav.actionArg != null) {
		    //	$scope.openDetails(globalNav.actionArg);
		    //	$scope.closeOnSave = true;
	    	//}
	    	
	    	//globalNav.clearAction();
    	}
    	
    	//globalNav.registerController(globalNav.ACTION_PEOPLE, $scope.initAction);
    	$scope.initAction();
    }
}());