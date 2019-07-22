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
		
		$scope.showAdmin = false;

	    globalSettings.initSettings().then(
        	function() {        
				$scope.showAdmin = globalSettings.currProfile.admin == 'Y';

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
        
        $scope.openWorkspaces = function() {
			globalNav.showPref();
		}

		$scope.openTags = function() {
			globalNav.showTagsPreferences();
		}

		$scope.openFAQ = function() {
			globalNav.showFAQs();
		}

		$scope.openTeam = function() {
			globalNav.showTeam();
		}
        
        $scope.selectWrkSpc = function() {
	        globalSettings.log("SidebarController", "selectWrkSpc", $scope.selectedWrkSpace.wrkSpc)
	        globalSettings.selectWrkSpc($scope.selectedWrkSpace.wrkSpc);
		}
		
		
    }
}());