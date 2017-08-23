(function() {
    'use strict';

    angular
        .module('app')
        .controller('ProjectTaskboardController', ProjectTaskboardController);

    ProjectTaskboardController.$inject = ['$scope', '$state', '$stateParams', '$filter', '$q', '$sce', 'globalSettings', 'globalNav', 'insightsService', 'taskService', 'tagService', 'taskActivityService', 'projectService', 'peopleService', 'activityService'];

    function ProjectTaskboardController($scope, $state, $stateParams, $filter, $q, $sce, globalSettings, globalNav, insightsService, taskService, tagService, taskActivityService, projectService, peopleService, activityService) {
        $scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
        
        $scope.initId = $stateParams.id;
        $scope.selectedProject = null;
        $scope.taskSummary = null;
        $scope.taskSummaryDetails = null;
        $scope.showArchived = false;
        
        $scope.taskList = [];
        $scope.taskStates = [];
		$scope.priorities = [];
		$scope.taskSchedule = [];
		$scope.people = [];
		$scope.assignees = [];
		
		globalSettings.initSettings().then(
        	function() {
	        	$scope.taskAliasPural = globalSettings.currWorkspace.Terminology.taskAliasPlural;
				$scope.taskAlias = globalSettings.currWorkspace.Terminology.taskAlias;
				$scope.projAliasPlural = globalSettings.currWorkspace.Terminology.projectAliasPlural;
				$scope.projectLabel = globalSettings.currWorkspace.Terminology.projectAlias;
        
				
				$scope.taskStates = taskService.getTaskStates();
		        $scope.priorities = taskService.priorities;
		        $scope.taskSchedule = taskService.taskSchedule;
		        $scope.taskSummary = taskService.taskSummary;
		        $scope.grouping = $scope.taskStates;
        
	        	$scope.populateTasks();
	        	
        });
		
		$scope.populateSummary = function() {
			var deferred = $q.defer();
			
			var projId = ($scope.selectedProject == null) ? null : $scope.selectedProject.$id;
			
			if (projId == null) {
				$scope.taskSummary = null;
				deferred.resolve(true);
			} else {
				insightsService.calProjectSummary(projId).then(
					function(summary) {

						insightsService.getTaskSummaryForProject(projId).then(
							function(summary) {
								$scope.taskSummary = summary;
								deferred.resolve(true);						
							}
						)
					}
				)
			}
			
			return deferred.promise;
		}
		
		$scope.populateTasks = function() {
	       var deferred = $q.defer();
			    
			taskService.getAllTasks().then(
				function(tasks) {
					
					$scope.taskList = tasks;
					
					$scope.populatePeople().then(
						function(peopleResult) {
							$scope.populateProjects().then(
								function(result) {
									deferred.resolve(true);
							});
					});
			});    
			    			
			return deferred.promise;
		}
		
		$scope.selectDefaultProject = function(projects) {
			var result = null;
			var len = projects.length;
			var defProj = globalSettings.currWorkspace.Settings.Project.defaultProject;
			
			
			if ($scope.initId != null && $scope.initId != "") {
				defProj = $scope.initId;
				$scope.initId = null;
			}
				
			if (defProj != null) {
				for (var i=0; i<len; i++) {
					if (defProj == projects[i].$id) {
						result = projects[i];
						break;
					}
				}
			}
			
			
			return result;
		}
		
		$scope.populateProjects = function() {
			var deferred = $q.defer();
			
			projectService.getAllProjects().then(
				function(projects) {
					$scope.allProjects = projects;
					if (projects != null && projects.length > 0) {
						$scope.selectedProject = $scope.selectDefaultProject(projects);
					}
			        
			        var defaultGroup = globalSettings.currPreferences.Settings.Project.taskBoardGroup;
			        
			        $scope.updateViewBy(defaultGroup);
			        $scope.updateOrderBy(globalSettings.currPreferences.Settings.Project.taskBoardOrder);
			        deferred.resolve(true);
			});
			
			return deferred.promise;	
		}
		
		$scope.populatePeople = function() {
			var deferred = $q.defer();
			
		    peopleService.getAllPeople().then (
			    function(people) {
				    $scope.people = people;
				    deferred.resolve(true);
				}
		    );
		    
		    return deferred.promise;
	    }
	    
	    $scope.buildAssignees = function() {
			var tmp = [];
		    var filteredList = $filter('filter')($scope.taskList, {projectId: $scope.selectedProject.$id});
			var len = filteredList.length;
		    var person;
		    var people = $scope.people;
		    
		    for (var i=0; i<len; i++) {
			    if (filteredList[i].delegateId != null) {
			    	person = peopleService.lookupPerson(filteredList[i].delegateId, people);
			    	tmp.uniquePush(person);
			    }
			    
			    if (filteredList[i].ownerId != null) {
			    	person = peopleService.lookupPerson(filteredList[i].ownerId, people);
			    	tmp.uniquePush(person);
			    }
		    }
		    
		    $scope.assignees = tmp;

	    }
	    
	    $scope.toggleSelected = function(person) {
	        person.isSelected = (person.isSelected == null ? true : !person.isSelected);
	        
	        taskService.determineSelectedOwners();
        }

        
        $scope.viewByFld = 'Status';
        $scope.orderByFld = 'due';
        
        $scope.taskTotal = 0;
        
        $scope.today = new Date();
        $scope.disabledDD = false;
        
        $scope.sortableOptions = {
            connectWith: ".connectList",
            disabled: false,
            taskId: null,
            dropId: null,
            update: function(event, ui) {
	            //console.log("update");
	            
	            if (!ui.item.sortable.received &&
	            	ui.item.sortable.source[0] !== ui.item.sortable.droptarget[0]) {
	            	this.dropId = ui.item.sortable.droptarget[0].id.split(',');
	            	this.taskId = ui.item[0].id;
	            	
	            	//console.log("update.dropId: " + this.dropId);
	            	//console.log("update.taskId: " + this.taskId);
	            	
	            	//console.log("cancel");
	            	ui.item.sortable.cancel();		            	
	            			            	
	            }
            },
            stop: function(event, ui) {
	            globalSettings.log("task.service", "stop", "stop");
	            
	            globalSettings.log("task.service", "stop", "stop.dropId: " + this.dropId);
	            globalSettings.log("task.service", "stop", "stop.taskId: " + this.taskId);
	            
	            if (this.dropId != null && this.taskId != null) {
		            var tmpDropId = this.dropId;
		            
		            var orig = taskService.lookupTask(this.taskId, $scope.taskList);
			        taskService.cloneTask(orig).then(
				        function(task) {
					        if (task != null) {
						        tagService.retrieveTags(orig.tags).then(
							        function(tags) {
								        task.tags = tags;
								        switch (tmpDropId[0]) {
						                	case $scope.projectLabel:
						                	    task[tmpDropId[1]] = projectService.findProject(tmpDropId[2]); 
						                	    taskActivityService.saveTask(task, orig);
						                	    break;
											default:
						            	        task[tmpDropId[1]] = tmpDropId[2];
						            	        taskActivityService.saveTask(task, orig);
						            	}
							    }); 
				            }
				        }
			        )

	            }
	            
	            this.dropId = null;
	            this.taskId = null;
	            
            }
        };
        
        $scope.updateViewBy = function(viewBy) {
            $scope.viewByFld = viewBy;
            $scope.disabledDD = false;
            $scope.sortableOptions.disabled = false;
            
            if (viewBy == 'Status') {
                $scope.grouping = $scope.taskStates;
                
            } else if (viewBy == 'Schedule') {
	           $scope.disabledDD = true;
	           $scope.sortableOptions.disabled = true;
               $scope.grouping = $scope.taskSchedule;
            } else if (viewBy == 'Priority') {
               $scope.grouping = $scope.priorities;
            }
            
            $scope.buildSummary();
        }
        
        
        $scope.updateOrderBy = function(orderBy) {
            
            if (orderBy == 'Schedule') {
                $scope.orderByFld = 'due';
            } else if (orderBy == 'Title') {
               $scope.orderByFld = 'title';
            } else if (orderBy == 'Priority') {
               $scope.orderByFld = 'priority';
            } 
        }
        
        $scope.determineOrder = function(item) {
            var result = '';
            
            if ($scope.orderByFld == 'due') {
                result = item.due;
            } else if ($scope.orderByFld == 'title') {
				result = item.title;
            } else if ($scope.orderByFld == 'priority') {
	            var tmp = item.priority;
	            
	            if (tmp == "H") {
		            result = 1;
	            } else if (tmp == "M") {
		            result = 2;
	            } else if (tmp == "L") {
		            result = 3;
	            } else {
		            result = 4;
	            }
	            
            } 
            
            return result;
        }
        
        
        $scope.getFilter = function(val) {
	        var projId = null;
	        var result = {};
	        
	        if ($scope.selectedProject != null) {
		        projId = $scope.selectedProject.$id;
		    }
	        
            switch ($scope.viewByFld) {
                case 'Priority':
                    result = {priority: val.code, projectId:projId}; break;
                case 'Schedule':
                    result = {state: val.label, projectId:projId}; break;
                default:
                    result = {status: val.label, projectId:projId};
            }
            
            if (!$scope.showArchived) {
	            result.archived = "!";
            }
            
            return result;
        }
        
        $scope.getFilterId = function(val) {
            switch ($scope.viewByFld) {
                case 'Priority':
                    return $scope.viewByFld + ',priority,' + val.code;
                case 'Schedule':
                    return $scope.viewByFld + ',state,' + val.label;
                default:
                    return $scope.viewByFld + ',status,' + val.label;
            }
        }
        
        $scope.formatContent = function(content) {
			return $sce.trustAsHtml(content);
		}
        
        $scope.newTask = function() {
            $scope.nav.newTask($scope.selectedProject.$id);
        }
        
        $scope.openTaskDetails = function(taskItem) {
            $scope.nav.openTaskDetails(taskItem.$id);
        }
        
        $scope.sumData = [];
        $scope.sumLabel = [];
        $scope.sumLegend = [];
        $scope.chartOptions = { colors : $scope.gs.pref.colors };
        
        $scope.determineSummaryData = function() {
            var summary = []; 
            
            switch ($scope.viewByFld) {
                case 'Priority':
                    summary = ($filter('filter')($scope.taskSummary.details, {type:'priority'}));
                    break;
                case 'Schedule':
                    summary = ($filter('filter')($scope.taskSummary.details, {type:'state'}));
                    break;
                default:
                	summary = ($filter('filter')($scope.taskSummary.details, {type:'status'}));
            }
            
             $scope.taskTotal = $scope.taskSummary.total;
            
            return summary;
        }
        
        $scope.determineSummaryColors = function (summary) {
    		var colors = $scope.gs.pref.colors;
    		
    		for (var i=0; i<summary.length; i++) {
    			summary[i].color = colors[i];
    		}
    		
		}
        
        $scope.buildSummary = function() {
	        //globalSettings.log("project.taskboard.controller", "buildSummary", "selectedProject: " + $scope.selectedProject);
	        $scope.buildAssignees();
	        
	        if ($scope.selectedProject != null) {
		        //console.log("*** buildSummary");
		        
		        //actType, tar, tarId, tarType, pers, proj, detail1, detail2
	        	activityService.addAccessActivity(activityService.TYPE_ACCESS, $scope.selectedProject, $scope.selectedProject.$id, 
	        										activityService.TAR_TYPE_PROJECT, null, $scope.selectedProject);   
		        
		        $scope.populateSummary().then(
			        function(result) {
				    	$scope.sumLegend = $scope.determineSummaryData();
			            $scope.sumData = $scope.sumLegend.map(function(sd){
			            	return sd.data;
			            });
			        	$scope.sumLabel = $scope.sumLegend.map(function(sd){
			            	return sd.label;
			            });
				            
				        $scope.determineSummaryColors($scope.sumLegend);   
			        }
		        )
	        }
        }
        
        $scope.getTotalChecklistDone = function(items) {
	        var total = 0;
	        
	        if (items) {
	        	total = ($filter('filter')(items, {isDone:true})).length;
	        }
	        
	        return total;
        }
        
        $scope.openProjectDetails = function() {
            $scope.nav.openProjectDetails($scope.selectedProject.$id);
        }
        
        $scope.toggleArchived = function() {
	        $scope.showArchived = !$scope.showArchived;
        }
        
        $scope.archiveTasks = function() {
	        var projId = null;
	        
	        if ($scope.selectedProject != null) {
		        projId = $scope.selectedProject.$id;
		        var fltr = {projectId:projId};
		        
		        taskService.archiveCompleted(fltr);
		    }

        }
        
        taskService.registerController($scope.buildSummary);
    
    }
}());