(function() {
    'use strict';

    angular
        .module('app')
        .controller('ProjectDetailsController', ProjectDetailsController);

    ProjectDetailsController.$inject = ['$scope', '$rootScope', '$state', '$window', '$filter', '$sce', 'globalSettings', 
    	'globalNav', 'peopleService', 'projectService', 'activityService', 'taskService', 'taskActivityService', 'journalService'];

    function ProjectDetailsController($scope, $rootScope, $state, $window, $filter, $sce, globalSettings, globalNav, 
    			peopleService, projectService, activityService, taskService, taskActivityService, journalService) {
	    			
        $scope.$state = $state;
        $scope.gs = globalSettings;
        $scope.ac = activityService;
        
        $scope.options = {
            animate:{
                duration:500,
                enabled:true
            },
            barColor:'#009000',
            scaleLength: 0,
            lineWidth:10,
            lineCap:'square',
            size:150
        };
	    	    
	    $scope.groupingFormat = {
					sameDay: "[Today]",
					nextDay: "[Tomorrow]",
					nextWeek: "dddd",
					lastDay: "[Yesterday]",
					lastWeek: "[Last week]",
					sameElse: "MMMM YYYY"
					};
	    
	    $scope.activity = null;
	    $scope.activityGrouping = null;	    
		$scope.activityRegistration = null;
	    
	    $scope.selectedProject = null;
        $scope.selectedProjectSrc = null;
		
		$scope.entries = null;
        $scope.tasks = null;
        $scope.people = null;
        $scope.taskGrouping = null;
        
        $scope.formatContent = function(content) {
			return $sce.trustAsHtml(content);
		}
        
        $scope.openDetails = function(project) {
	        
	        if (project == null){
		        $scope.selectedProject = projectService.newProject();
		        
	        } else {
	        	$scope.selectedProjectSrc = project;
	        	$scope.selectedProject = project;
	        	
				$scope.retrieveTasks(project.$id);
				$scope.retrieveJournal(project.$id);
	        	$scope.refreshActivity();
	        	
	        	//actType, tar, tarId, tarType, pers, proj, detail1, detail2
	        	activityService.addAccessActivity(activityService.TYPE_ACCESS, project, project.$id, activityService.TAR_TYPE_PROJECT, null, project);   	
	        }
        }
        
        $scope.retrieveClients = function(project) {
	        peopleService.retrievePeople(project.people).then( 
	        	function(people) {
		        	$scope.people = people;
	        	}
	        )
        }
        
        $scope.retrieveTasks = function(projId) {
			taskService.getTaskStates().then(
				function(list){
					var orderedList = list;

					taskService.getTasksForProject(projId).then(
						function(tasks) {
							var i = 0;
							var tmpGrouping = [];
							
							var len = orderedList.length;
							var cnt;
							
							for (i=0; i<len; i++) {
								cnt = ($filter('filter')(tasks, $scope.getFilter(orderedList[i]))).length;
								if (cnt > 0) {
									tmpGrouping.uniquePush(orderedList[i]);
								}
							}
							
							$scope.taskGrouping = tmpGrouping;
							$scope.tasks = tasks;
						}
					)
				}
			)
		}
		
		$scope.retrieveJournal = function(projId) {
	        journalService.getAllEntries().then(
			   	function(entries) {
			   		$scope.entries = entries; 	
			});
        }
        
        $scope.getFilter = function(val) {
	        return {status: val.label};
    	}
	    
        
        $scope.refreshActivity = function() {
	     	if ($scope.selectedProject != null) {
		     	activityService.getRecentActivity().then(
					function(act) {
						//var personKey = globalSettings.currProfile.person;
						var filter = {projectId: $scope.selectedProject.$id};
						
						activityService.determineRecentActivityGrouping(filter).then(
							function(tmpGrouping) {
								$scope.activityGrouping = tmpGrouping;
								$scope.activity = act;
						});
				});
	     	}   
        }
        
        $scope.savePerson = function() {
	        peopleService.savePerson($scope.selectedProject, $scope.selectedProjectSrc);
	        $scope.closeDetails();
        }
        
        $scope.cancelEdit = function() {
	        $scope.closeDetails();
        }
        
        $scope.editProject = function() {
	        globalNav.openProjectEditDetails($scope.selectedProject.$id);
        }
        
        $scope.deleteProject = function() {
	        peopleService.deletePerson($scope.selectedProjectSrc);
	        $scope.closeDetails();

        }
        
        $scope.closeDetails = function() {
	        $scope.selectedProjectSrc = null;
	        globalNav.hideSideViewForm();
	    }
    	
    	$scope.initAction = function() {
	    	if (globalNav.action == globalNav.ACTION_PROJECT_OPEN_DETAILS
	    		&& globalNav.actionArg != null) {
		    	projectService.findProject(globalNav.actionArg).then(
		    		function(project) {
		    			$scope.openDetails(project);
		    	});
	    	} else if (globalNav.action == globalNav.ACTION_PROJECT_NEW) {
		    	$scope.openDetails(null);
	    	} 
	    	
	    	globalNav.clearAction();
    	}
    	
    	$scope.hasTaskGroup = function(grp) {
	    	if ($scope.selectedProject == null || $scope.selectedProject.projTasks == null) {
		    	return false;
	    	} else {
	    		return ($filter('filter')($scope.selectedProject.projTasks, {status: grp.label}, true)).length > 0;
	    	}
    	}
    	
    	$scope.openTaskDetails = function(taskItem) {
	    	if (taskItem == null) {
		    	globalNav.newTask($scope.selectedProject.$id);
		    } else {
	    		globalNav.openTaskDetails(taskItem.$id);
	    	}
    	}
    	
    	$scope.openPersonDetails = function(personId) {
	    	globalNav.openPeopleDetails(personId);
    	}
    	
    	$scope.updateTaskIsDone = function(item) {
	        taskActivityService.updateStatus(item, item.isDone);
        }
    	
        $scope.openEntryDetails = function(entry) {
            globalNav.openJournalEditDetails(entry.$id);
        }
    	
    	globalNav.registerViewController(globalNav.ACTION_PROJECT, $scope.initAction);
    	//$scope.activityRegistration = activityService.registerController($scope.refreshActivity);
    	
    	//$scope.$on('$destroy', function cleanUp() {
		//	globalSettings.log("projects.controller", "cleanUp", "CLEANING");
		//	if ($scope.activityRegistration != null) {
		//		$scope.activityRegistration();
		//	}
		//})
    	
    	
    	$scope.initAction();
    }
}());