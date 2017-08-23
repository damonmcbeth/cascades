(function() {
    'use strict';

    angular
        .module('app')
        .controller('SidebarController', SidebarController);

    SidebarController.$inject = ['$scope', '$state', 'globalSettings', 'globalNav', 'tagService', 'taskService', 'peopleService', 'projectService', 'journalService'];

    function SidebarController($scope, $state, globalSettings, globalNav, tagService, taskService, peopleService, projectService, journalService) {
	    $scope.nav = globalNav;
	    $scope.gs = globalSettings;
	    
	    $scope.selectedWrkSpace = {};
	    $scope.wrkSpcs;
	    
	    
	    
	    
	    globalSettings.initSettings().then(
        	function() {        
	        	$scope.initSelectedWrkSpace();
	        	$scope.populateTags();
	        	
        });
        
        $scope.initSelectedWrkSpace = function() {	        
	        $scope.wrkSpcs = globalSettings.userWorkspaces;
	        var len = ($scope.wrkSpcs == null) ? 0 : $scope.wrkSpcs.length;
	        var currWrkSpaceId = globalSettings.currWorkspace.$id;
	        var tmp;
	        
	        for (var i=0; i<len; i++) {
		        tmp = $scope.wrkSpcs[i];
		        if (tmp.$id == currWrkSpaceId) {
			        $scope.selectedWrkSpace.wrkSpc = tmp;
			        break;
		        }
	        }
        }
	    
	    $scope.populateTags = function() {
		    tagService.getAllTags().then (
			    function(tags) {
					$scope.tags = tags;
				}
		    );
	    }
	    
        $scope.$on('$includeContentLoaded', function() {
            yima.sidebarInit();
        });
        
        $scope.toggleHighlight = function(tag) {
	        tagService.toggleHighlight(tag);
	        
	        taskService.determineHighlightTasks();
	        projectService.determineHighlightProjects();
	        peopleService.determineHighlightPeople();
	        journalService.determineHighlightEntries();
        }
        
        /**$scope.determineAvatarUrl = function() {
	        var profile = globalSettings.currProfile;
	        var result = "";
	        
	        if (profile != null && profile.avatar !== undefined) {
		        if (profile.avatarType == "Custom") {
			        result = profile.avatar;
		        } else {
			        result = "assets/img/avatars/" + profile.avatar;
		        }
	        }
	        
	        return result;
        }**/
        
        
        $scope.selectWrkSpc = function() {
	        globalSettings.log("SidebarController", "selectWrkSpc", $scope.selectedWrkSpace.wrkSpc)
	        globalSettings.selectWrkSpc($scope.selectedWrkSpace.wrkSpc);
        }
    }
}());