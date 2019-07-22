(function() {
    'use strict';

    angular
        .module('app')
        .controller('TaskboardController', TaskboardController);

    TaskboardController.$inject = ['$scope', '$state', '$window', '$q', '$sce', '$stateParams', '$filter', 'globalSettings', 'globalNav', 'taskService', 'tagService', 'projectService', 'taskActivityService', 'insightsService', 'peopleService', 'activityService'];

    function TaskboardController($scope, $state, $window, $q, $sce, $stateParams, $filter, globalSettings, globalNav, taskService, tagService, projectService, taskActivityService, insightsService, peopleService, activityService) {
        $scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
        
        $scope.initId = $stateParams.id;
		$scope.selectedProject = null;
		$scope.selectedOwner = null;
		$scope.selectedPerson = null;
        $scope.taskSummary = null;
        $scope.taskSummaryDetails = null;
		$scope.showArchived = false;
		$scope.selectMode = false;
		$scope.selectedOwnerInit = false;

		$scope.anyone = "anyone";
		$scope.currUser = null;
        
        $scope.taskList = [];
        $scope.taskStates = [];
		$scope.priorities = [];
		$scope.taskSchedule = [];
		$scope.people = [];
		$scope.assignees = [];

		$scope.allProjects = [];
		$scope.tags = [];
		
		globalSettings.initSettings().then(
        	function() {
	        	$scope.taskAliasPural = globalSettings.currWorkspace.Terminology.taskAliasPlural;
				$scope.taskAlias = globalSettings.currWorkspace.Terminology.taskAlias;
				$scope.projAliasPlural = globalSettings.currWorkspace.Terminology.projectAliasPlural;
				$scope.projectLabel = globalSettings.currWorkspace.Terminology.projectAlias;
				$scope.currName = globalSettings.currProfile.name;
				$scope.currUser = globalSettings.currProfile.person;

				$scope.priorities = taskService.priorities;
		        $scope.taskSchedule = taskService.taskSchedule;
		        $scope.taskSummary = taskService.taskSummary;

				$scope.populateTags();

				taskService.getTaskStates().then(
					function(list){
						$scope.taskStates = list;
						$scope.grouping = $scope.taskStates;
						$scope.populateTasks();
					}
				)
				
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

		$scope.populateTags = function() {
		    tagService.getAllTags().then (
			    function(tags) {
					$scope.tags = tags;
				}
		    );
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
				
			//if (defProj != null) {
				for (var i=0; i<len; i++) {
					if (defProj != null && defProj == projects[i].$id) {
						result = projects[i];
						projects[i].show = true;
						//break;
					} else {
						projects[i].show = !projects[i].isDone;
					}
				}
			//}
			
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
			var filteredList = [] 
			var taskFilter = {};
			
			if (!$scope.showArchived) {
	            taskFilter.archived = "!";
            }

			if ($scope.selectedProject == null) {
				taskFilter.projectId = '!';
			} else {
				taskFilter.projectId = $scope.selectedProject.$id;
			}

			filteredList = $filter('filter')($scope.taskList, taskFilter);

			var len = filteredList.length;
		    var person;
		    var people = $scope.people;
			
			person = peopleService.lookupPerson($scope.currUser, people);
			tmp.uniquePush(person);
			if (!$scope.selectedOwnerInit) {
				$scope.selectedOwner = person;
				$scope.selectedOwnerInit = true;
			}

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
	        
            switch ($scope.viewByFld) {
                case 'Priority':
                    result = {priority: val.code}; break;
                case 'Schedule':
                    result = {state: val.label}; break;
                default:
                    result = {status: val.label};
            }
            
            return result;
		}
		
		$scope.includeTask = function() {
		    return function(item) {
				if (!$scope.showArchived && item.archived) {
					return false;
				}

				if ($scope.selectedPerson != null 
					&& (item.relatedId != $scope.selectedPerson.$id && $scope.selectedPerson.$id != item.ownerId 
						&& $scope.selectedPerson.$id != item.delegateId)) {
					return false;
				}

				if ($scope.selectedProject == null) {
					if (item.projectId != null) {
						return false;
					}
				} else {
					if ($scope.selectedProject.$id != item.projectId ) {
						return false;
					}
				}

				var owner = $scope.selectedOwner
				if (owner != $scope.anyone) {
					if (owner == null) {
						if (item.ownerId != null) {
							return false;
						}
					} else {
						if (owner.$id != item.ownerId && owner.$id != item.delegateId) {
							return false;
						}
					}
				}

				return true;
		    }
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
			if (!$scope.selectMode) {
				$scope.nav.openTaskDetails(taskItem.$id);
			} else {
				taskItem.selectedActionItem = !taskItem.selectedActionItem;
			}
        }
        
        $scope.sumData = [];
        $scope.sumLabel = [];
        $scope.sumLegend = [];
		$scope.chartOptions = { colors : $scope.gs.pref.colors,
								responsive : false  };
        
        $scope.determineSummaryData = function() {
            var summary = []; 
            
            switch ($scope.viewByFld) {
                case 'Priority':
                    summary = ($filter('filter')($scope.taskSummary.details, {archived: '!', type:'priority'}));
                    break;
                case 'Schedule':
                    summary = ($filter('filter')($scope.taskSummary.details, {archived: '!', type:'state'}));
                    break;
                default:
                	summary = ($filter('filter')($scope.taskSummary.details, {archived: '!', type:'status'}));
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
        
        $scope.buildSummary = function(resetPeopleFilter) {
			if (resetPeopleFilter) {
				$scope.selectedOwner = $scope.anyone;
			}

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
			var fltr = {};
			

	        if ($scope.selectedProject != null) {
		        projId = $scope.selectedProject.$id;
		        fltr = {projectId:projId};
			} else {
				fltr = {projectId:'!'};
			}
			
			taskService.archiveCompleted(fltr);

		}
		
		$scope.toggleSelect = function() {
			if ($scope.selectMode) {
				var len = $scope.taskList.length;
				
				for (var i=0; i<len; i++) {
					$scope.taskList[i].selectedActionItem = false;
				}
			}

			$scope.selectMode = !$scope.selectMode;
		}
		
		$scope.hasSelected = function() {
			var result = false;
			var len = $scope.taskList.length;

			for (var i=0; i<len; i++) {
				if ($scope.taskList[i].selectedActionItem == true) {
					result = true;
					break;
				}
			}

			return result;
		}

		$scope.updateDueDate = function(target) {
			var value = null;

			switch (target) {
				case 'In 2 hours': value = moment().startOf('hour').add(2, 'hours').toDate(); break; 
				case 'In 4 hours': value = moment().startOf('hour').add(4, 'hours').toDate(); break; 
				case 'This evening': value = moment().startOf('day').add(18, 'hours').toDate(); break;
				case 'Tomorrow morning': value = moment().startOf('day').add(1, 'days').add(8, 'hours').toDate(); break; 
				case 'Tomorrow evening': value = moment().startOf('day').add(1, 'days').add(18, 'hours').toDate();break; 
				case '2 days from now': value = moment().startOf('hour').add(2, 'days').toDate(); break; 
				case 'Next week': value = moment().startOf('hour').add(7, 'days').toDate();
			}

			$scope.groupUpdateTasks('due', value);
		}

		$scope.updatePriority = function(target) {
			var value = null;

			switch (target) {
				case 'High': value = "H"; break;
				case 'Medium': value = "M"; break;
				case 'Low': value = "L"; break;
				case 'None': value = "N"; break; 
			}

			$scope.groupUpdateTasks('priority', value);
		}

		$scope.updateProject = function(target) {
			$scope.groupUpdateTasks('project', target);
		}

		$scope.updateAssignment = function(target) {
			$scope.groupUpdateTasks('owner', target);
		}
		
		$scope.updateTag = function(target) {
			$scope.groupUpdateTasks('tag', target);
		}

		$scope.removeAllTags = function(target) {
			$scope.groupUpdateTasks('removeTags', null);
		}

		$scope.removeDueDate = function(target) {
			$scope.groupUpdateTasks('due', null);
		}

		$scope.groupUpdateTasks = function(fld, val) {
			if ($scope.hasSelected()) {
				var len = $scope.taskList.length;
				
				for (var i=0; i<len; i++) {
					if ($scope.taskList[i].selectedActionItem == true) {
						$scope.updateTask(fld, val, $scope.taskList[i]);
					}
				}
				globalSettings.showSuccessToast(globalSettings.currWorkspace.Terminology.taskAlias + ' updated.');

			}

			//$scope.toggleSelect();
		}

		$scope.updateTask = function(fld, val, orig) {
			$scope.cloneTask(orig).then(
				function(task) {
					switch (fld) {
						case 'removeTags': task.tags = []; break;
						case 'tag': $scope.addUniqueTag(task, val); break;
						case 'project': $scope.assignProjectToTask(task, val); break;
						case 'owner': $scope.assignOwnerToTask(task, val); break;
						default: task[fld] = val;
					}
					taskActivityService.saveTask(task, orig);
				}
			)
		}

		$scope.clearRelated = function() {
			$scope.selectedPerson = null;
			$scope.relatedSearchText = null;
		}

		$scope.assignOwnerToTask = function(task, person) {
			task.ownerId = person.$id;
			task.owner = person;
		}

		$scope.assignProjectToTask = function(task, project) {
			var proj = $scope.allProjects.$getRecord(project.$id);

			task.projectId = proj.$id;
			task.project = proj;
		}

		$scope.addUniqueTag = function(task, tag) {
			var found = false;
			var len = task.tags.length;
			var tags = task.tags;

			for (var i=0; i<len; i++) {
				if (tags[i].$id == tag.$id) {
					found = true;
					break;
				}
			}

			if (!found) {
				task.tags.push(tag);
			}
		}

		$scope.cloneTask = function(taskItem) {
			var deferred = $q.defer();

			taskService.cloneTask(taskItem, null).then(
				function(clonedTask) {
					tagService.retrieveTags(taskItem.tags).then(
						function(tags) {
							clonedTask.tags = tags;
							deferred.resolve(clonedTask);	
					});   	  
			});

			return deferred.promise;
		}
        
        taskService.registerController($scope.buildSummary);
    
    }
}());