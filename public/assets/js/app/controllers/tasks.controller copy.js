(function() {
    'use strict';

    angular
        .module('app')
        .controller('TasksController', TasksController);

    TasksController.$inject = ['$scope', '$rootScope', '$state', '$mdDialog', 'globalSettings', 
    	'globalNav', 'taskService', 'projectService', 'peopleService'];

    function TasksController($scope, $rootScope, $state, $mdDialog, globalSettings, globalNav, taskService, projectService, peopleService) {
        $scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
        
        $scope.taskAliasPlural = globalSettings.pref.org.taskAliasPlural;
        $scope.taskAlias = globalSettings.pref.org.taskAlias;
        
        taskService.getAllTasks().then(
			function(tasks) {
				$scope.taskList = tasks;
		});
        
        $scope.showDetails = false;
        
        $scope.priorities = taskService.priorities;
	    
	    peopleService.getAllPeople().then(
			function(people) {
				$scope.owners = people;
		});
	    
	    $scope.projects = projectService.allProjects;
	    
	    $scope.taskStates = globalSettings.pref.task.states;
	    
	    $scope.taskSchedule = taskService.taskSchedule;
	    
	    $scope.closeOnSave = false;
	           
        $scope.selectedTask = taskService.newTask();
        $scope.selectedTaskSrc = null;
        
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
	    
	    $scope.updateViewBy(globalSettings.pref.task.quickGroup);
                
        $scope.openDetails = function(taskItem) {
	        globalNav.openTaskDetails(taskItem);
        }
        
        $scope.saveTask = function() {
	        taskService.saveTask($scope.selectedTask, $scope.selectedTaskSrc);
	        $scope.selectedTaskSrc = null;
	        $scope.selectedTask = taskService.newTask();
	        $scope.closeDetails();
        }
        
        $scope.cancelEdit = function() {
	        $scope.selectedTaskSrc = null;
	        $scope.selectedTask = taskService.newTask();
	        $scope.closeDetails();
        }
        
        $scope.updateIsDone = function(item, status) {
	        taskService.updateStatus(item, item.isDone);
        }
        
        $scope.updateStatus = function(item) {
	        taskService.updateStatus(item);
        }
        
        $scope.deleteTask = function() {
	        taskService.deleteTask($scope.selectedTaskSrc);
	        $scope.closeDetails();

        }
        
        $scope.closeDetails = function() {
	        if ($scope.closeOnSave) {
		        $scope.closeOnSave = false;
		        globalNav.hideSideForm();
	        } else {
	        	$scope.showDetails = false;
	        }
        }
        
        $scope.selectOwner = function() {
	        $scope.selectedTask.ownerId = $scope.selectedTask.owner.userId;
        }
        
        $scope.selectDelegate = function() {
	        peopleService.findPerson($scope.selectedTask.delegateId).then(
				function(person) {
					$scope.selectedTask.delegate = person;
				}
		    );
        }
	    
	    
	    
	    $scope.getFilter = function(val) {
	        switch ($scope.viewByFld) {
	            case 'Priority':
	                return {priority: val.code};
	            case 'Schedule':
	                return {state: val.label};
	            default:
	                return {status: val.label}
	        }
    	}
    	
    	$scope.transformChip = function(chip) {
		      // If it is an object, it's already a known chip
		      if (angular.isObject(chip)) {
		        	return chip;
		      }
		
		      // Otherwise, create a new one
		      return { name: chip, type: 'new' }
	    }
	    
	    $scope.manageTags = function(ev) {
		    $mdDialog.show({
		      controller: DialogController,
		      templateUrl: 'partials/tagManager.html',
		      parent: angular.element(document.body),
		      targetEvent: ev,
		      clickOutsideToClose:true,
		      fullscreen:true // Only for -xs, -sm breakpoints.
		    })
		    .then(function(answer) {
		      $scope.status = 'You said the information was "' + answer + '".';
		    }, function() {
		      $scope.status = 'You cancelled the dialog.';
		    });
		};
		
		function DialogController($scope, $mdDialog) {
		    $scope.hide = function() {
		      $mdDialog.hide();
		    };
		
		    $scope.cancel = function() {
		      $mdDialog.cancel();
		    };
		
		    $scope.answer = function(answer) {
		      $mdDialog.hide(answer);
		    };
		}
    	
    	$scope.initAction = function() {
	    	if (globalNav.action == globalNav.ACTION_TASK_OPEN_DETAILS
	    		&& globalNav.actionArg != null) {
		    	$scope.openDetails(globalNav.actionArg);
		    	$scope.closeOnSave = true;
	    	} else if (globalNav.action == globalNav.ACTION_TASK_NEW) {
		    	$scope.openDetails(null);
		    	$scope.closeOnSave = true;
	    	} 
	    	
	    	globalNav.clearAction();
    	}
    	
    	//globalNav.registerController(globalNav.ACTION_TASK, $scope.initAction);
    	//$scope.initAction();
    }
}());