(function() {
    'use strict';

    angular
        .module('app')
        .controller('TasksController', TasksController);

    TasksController.$inject = ['$scope', '$rootScope', '$state', '$mdDialog', '$filter', 'globalSettings', 
    	'globalNav', 'taskService', 'projectService', 'peopleService', 'taskActivityService'];

    function TasksController($scope, $rootScope, $state, $mdDialog, $filter, globalSettings, 
    						globalNav, taskService, projectService, peopleService, taskActivityService) {
        $scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
        $scope.search = '';
        
        
        $scope.populateTasks = function() {
	        taskService.getAllTasks().then(
				function(tasks) {
					$scope.taskList = tasks;
			});
		}
		
		$scope.populatePeople = function() {
	        peopleService.getAllPeople().then(
				function(people) {
					$scope.owners = people;
			});
		}
        
        $scope.populateAllowedValues = function() {
	        $scope.priorities = taskService.priorities;
	        
	        $scope.taskSchedule = taskService.taskSchedule;
	    
		    $scope.projects = projectService.allProjects;
		    
		    $scope.taskStates = globalSettings.currWorkspace.Settings.Task.states;
		    
		}
        
        $scope.grouping = [];
	    $scope.viewByFld = 'Schedule';
        
        $scope.updateViewBy = function(viewBy) {
		    $scope.viewByFld = viewBy;
		    
		    if (viewBy == 'Status') {
			    $scope.grouping = $scope.taskStates;
		    } else if (viewBy == 'Schedule') {
			   $scope.grouping = $scope.taskSchedule;
		    } else if (viewBy == 'Priority') {
			   $scope.grouping = $scope.priorities;
		    } 
	    }
	    
	    globalSettings.initSettings().then(
        	function() {
	        	$scope.populateTasks();
	        	$scope.populatePeople();
	        	$scope.populateAllowedValues();
	        	
	        	$scope.updateViewBy(globalSettings.currPreferences.Settings.Task.quickGroup);
        });
        
        $scope.hasGroup = function(group) {
	        if ($scope.taskList == null || $scope.taskList.length == 0) {
		        return false;
	        } else {
	        	var cnt = ($filter('filter')($scope.taskList, $scope.getFilter(group))).length;
	        	return cnt > 0;
	        }
        }
	    
	    $scope.newTask = function() {
	        globalNav.newTask();
        }
	    
        $scope.openDetails = function(taskItem) {
	        var taskId = (taskItem == null) ? null : taskItem.$id;
	        globalNav.openTaskDetails(taskId);
        }
        
        $scope.updateIsDone = function(item, status) {
	        taskActivityService.updateStatus(item, item.isDone);
        }
	    
	    $scope.getFilter = function(val) {
		    var owner = globalSettings.currProfile.person;
		    
	        switch ($scope.viewByFld) {
	            case 'Priority':
	                return {priority: val.code, ownerId: owner, archived: '!', $:$scope.search};
	            case 'Schedule':
	                return {state: val.label, ownerId: owner, archived: '!', $:$scope.search};
	            default:
	                return {status: val.label, ownerId: owner, archived: '!', $:$scope.search}
	        }
    	}
    }
}());