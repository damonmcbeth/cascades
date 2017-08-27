(function() {
    'use strict';

    angular
        .module('app')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$scope', '$state', '$window', '$filter', 'globalSettings', 'globalNav', 'tagService', 
								'taskService', 'activityService', 'projectService', 'journalService', 'insightsService', 'reminderService',
							'messageService'];

    function DashboardController($scope, $state, $window, $filter, globalSettings, globalNav, tagService,
							taskService, activityService, projectService, journalService, insightsService, reminderService,
						messageService) {
        

        $scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
                
        $scope.activity = [];
		
		$scope.cardOptions = {
            animate:{
                duration:500,
                enabled:true
            },
            barColor:'#009000',
            scaleLength: 0,
            lineWidth: 8,
            lineCap:'square',
            size:90
        };
        
        $scope.summary = {
	        				Journal: { unread: 0 },
	        				Task: { dueToday: 0,
		        					overdue: 0,
		        					dueSoon: 0,
		        					delegated: 0 },
							Project: { open: 0 }
		        		};
        $scope.reminders = null;
        
        $scope.recentPeopleFilter = {targetType: activityService.TAR_TYPE_PERSON};
        $scope.recentProjectFilter = {targetType: activityService.TAR_TYPE_PROJECT};
        $scope.recentNotesFilter = {targetType: activityService.TAR_TYPE_JOURNAL};
        
        $scope.hasReminder = false;
        
        
        globalSettings.initSettings().then(
        	function() {
	        	$scope.populateTasks();
				$scope.populateSummary();
				$scope.populateTags();
				$scope.populateReminder();
        });
        
        $scope.populateTags = function() {
	        tagService.getAllTags().then(
				function(tags) {
					//Do nothing
			});
		}
		
		$scope.populateSummary = function() {
			insightsService.getTaskSummary().then(
				function(summary) {
					$scope.summary = summary;
			});
		}
		
		$scope.populateReminder = function() {
			reminderService.getCurrentEntries().then(
				function(entries) {
					$scope.reminders = entries;
					
					$scope.hasReminder = $filter("filter")(entries, $scope.includeReminder('start')).length > 0;
			});
		}
		
		$scope.includeReminder = function(prop) {
		    return function(item) {
		      return item[prop] <= new Date();
		    }
		}
		
		globalSettings.shouldClearCache("insightsSer_TaskSumary")
        
        $scope.hasRecentProjects = function() {
	        return $filter("filter")($scope.activity, $scope.recentProjectFilter, true).length > 0;
		}
		
		$scope.hasRecentPeople = function() {
	        return $filter("filter")($scope.activity, $scope.recentPeopleFilter, true).length > 0;
		}
        
        $scope.populateTasks = function() {
	        taskService.getAllTasks().then(
				function(tasks) {
					$scope.taskSummary = taskService.taskSummary;
					
					activityService.getAccessActivity().then(
				        function(activity) {
					        $scope.activity = activity;

			        });
			});
		}

		$scope.sendTestMessage = function() {
			messageService.sendMessage("fxrn5l7oFdY:APA91bFEFRl4a5N2_fB_Pr_YqpBwfD6zjkd2FHKppvcrFqge75", "HELLO WORLD", "/assets/img/Timeline-128.png");
		}
		
        //$scope.openPersonDetails = function(pid) {
        //    $scope.nav.openPeopleDetails(pid);
        //}
        
        //$scope.openProjectDetails = function(projId) {
        //    $scope.nav.openProjectDetails(projId);
        //}
        
        
    }
}());