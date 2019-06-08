(function() {
    'use strict';

    angular
        .module('app')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$scope', '$state', '$window', '$filter', 'globalSettings', 'globalNav', 'tagService', 
								'taskService', 'activityService', 'projectService', 'journalService', 'insightsService', 'reminderService',
							'messageService', 'taskActivityService'];

    function DashboardController($scope, $state, $window, $filter, globalSettings, globalNav, tagService,
							taskService, activityService, projectService, journalService, insightsService, reminderService,
						messageService, taskActivityService) {
        

        $scope.$state = $state;        
        $scope.nav = globalNav;
		$scope.gs = globalSettings;
		$scope.ac = activityService;
		
		$scope.tasks = [];
		$scope.activity = [];
		$scope.fullActivity = [];
		$scope.grouping = [];
		
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
				$scope.taskAliasPural = globalSettings.currWorkspace.Terminology.taskAliasPlural;
				$scope.taskAlias = globalSettings.currWorkspace.Terminology.taskAlias;
				$scope.currName = globalSettings.currProfile.name;

	        	$scope.populateTasks();
				$scope.populateSummary();
				$scope.populateTags();
				$scope.populateReminder();
				$scope.populateActivity();
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
		
		$scope.includeTask = function() {
		    return function(item) {
			  return !item.isDone && (item.state == 'Overdue' || item.state == 'Due today');
		    }
		}

		$scope.includeReminder = function(prop) {
		    return function(item) {
		      return item[prop] <= moment().add(10, 'days').toDate();
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
					var owner = globalSettings.currProfile.person;
					$scope.tasks = $filter('filter')(tasks, {$:owner, isDone: false});
					
					activityService.getAccessActivity().then(
				        function(activity) {
					        $scope.activity = activity;

			        });
			});
		}

		$scope.populateActivity = function() {
	        activityService.getRecentActivity().then(
				function(act) {
					var personKey = globalSettings.currProfile.person;
					var filter = {createdBy: personKey};
					
					activityService.determineRecentActivityGrouping(filter).then(
						function(tmpGrouping) {
							$scope.fullActivity = act;
							$scope.grouping = tmpGrouping;
							
					});
			});
		}		

		$scope.openTaskDetails = function(taskItem) {
	        var taskId = (taskItem == null) ? null : taskItem.$id;
	        globalNav.openTaskDetails(taskId);
		}
		
		$scope.updateIsDone = function(item, status) {
	        taskActivityService.updateStatus(item, item.isDone);
        }
		
        //$scope.openPersonDetails = function(pid) {
        //    $scope.nav.openPeopleDetails(pid);
        //}
        
        //$scope.openProjectDetails = function(projId) {
        //    $scope.nav.openProjectDetails(projId);
        //}
        
        
    }
}());