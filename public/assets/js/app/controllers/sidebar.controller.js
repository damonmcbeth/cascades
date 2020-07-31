(function() {
    'use strict';

    angular
        .module('app')
        .controller('SidebarController', SidebarController);

    SidebarController.$inject = ['$scope', '$state', '$filter', 'globalSettings', 'globalNav', 'tagService', 'taskService', 'peopleService', 'projectService', 'journalService', 'ticketsService'];

    function SidebarController($scope, $state, $filter, globalSettings, globalNav, tagService, taskService, peopleService, projectService, journalService, ticketsService) {
	    $scope.nav = globalNav;
	    $scope.gs = globalSettings;
		
		$scope.tickets = 0;

	    $scope.selectedWrkSpace = {};
	    $scope.wrkSpcs;
		
		$scope.showAdmin = false;

		globalSettings.log("SidebarController", "initSettings", "Calling Global Settings");	
	    globalSettings.initSettings().then(
        	function() {  
				globalSettings.log("SidebarController", "initSettings", "Global Settings done");	      
				$scope.showAdmin = globalSettings.currProfile.admin == 'Y';

	        	$scope.initSelectedWrkSpace();
				$scope.populateTags();
				$scope.populateTickets();

				$scope.processFirstSignin();

				//globalSettings.logError("module", "Sample function", "Sample Message");
	        	
        });
		
		$scope.processFirstSignin = function() {
			var user = globalSettings.currProfile;

			if (user.showGuidedTour != "N") {
				$scope.openMainGuide();
				user.showGuidedTour = "N";
				user.$save();
			}

		}

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

		$scope.openDocs = function() {
			globalNav.showDocs();
		}

		$scope.openMainGuide = function() {
			var opt = {
				'doneLabel': 'End tour',
				'skipLabel': 'Exit tour', 
				'showProgress': true
			};

			introJs().setOptions(opt).start();
		}
        
        $scope.selectWrkSpc = function() {
	        globalSettings.log("SidebarController", "selectWrkSpc", $scope.selectedWrkSpace.wrkSpc)
	        globalSettings.selectWrkSpc($scope.selectedWrkSpace.wrkSpc);
		}

		$scope.populateTickets = function() {
	        ticketsService.getAllTickets().then(
				function(ts) {
					var tmp = $filter('filter')(ts, {status: "Open"});
					$scope.tickets = tmp.length;
					//$scope.tickets = ts;
				}
			);
		}
		
		
    }
}());