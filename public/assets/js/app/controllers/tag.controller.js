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
	        
	        $("#custom").spectrum({ color:$scope.selectedTag.color, change: function(color){
		        $scope.selectedTag.color= color.toHexString();
	        }});
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