(function() {
    'use strict';

    angular
        .module('app')
        .controller('TaskboardController', TaskboardController);

    TaskboardController.$inject = ['$scope', '$state', '$window', '$q', '$filter', 'globalSettings', 'globalNav', 'taskService', 'tagService', 'projectService', 'taskActivityService', 'insightsService', 'peopleService'];

    function TaskboardController($scope, $state, $window, $q, $filter, globalSettings, globalNav, taskService, tagService, projectService, taskActivityService, insightsService, peopleService) {
        $scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
        
		$scope.showArchived = false;
		$scope.selectMode = false;
        
        $scope.taskList = [];
		$scope.activeProjects = [];
		$scope.allProjects = [];
		$scope.delegates = [];
		$scope.team = [];
		
		$scope.tags = [];
        
        globalSettings.initSettings().then(
        	function() {
	        	$scope.taskAliasPural = globalSettings.currWorkspace.Terminology.taskAliasPlural;
				$scope.taskAlias = globalSettings.currWorkspace.Terminology.taskAlias;
				$scope.projectLabel = globalSettings.currWorkspace.Terminology.projectAlias;
				$scope.currName = globalSettings.currProfile.name;
	        	
		        $scope.priorities = taskService.priorities;
		        $scope.taskSchedule = taskService.taskSchedule;
		        $scope.taskSummary = taskService.taskSummary;
		        
		        $scope.viewByFld = 'Status';
		        $scope.orderByFld = 'due';
				$scope.selectMode = false;
				
		        $scope.taskTotal = 0;
		        
		        $scope.today = new Date();
		        $scope.disabledDD = false;
		        
		        $scope.sumData = [];
		        $scope.sumLabel = [];
		        $scope.sumLegend = [];
				$scope.chartOptions = { colors : globalSettings.pref.colors, 
										responsive : false };
				
				taskService.getTaskStates().then(
					function(list){
						$scope.taskStates = list;
						$scope.grouping = $scope.taskStates;

						$scope.populateTasks().then(
							function(cont) {
								$scope.populateProjects().then(
									function(projLoaded) {
										$scope.populatePeople();
										$scope.populateTags();
						
										var defaultGroup = globalSettings.currPreferences.Settings.Task.taskBoardGroup;
										defaultGroup = (defaultGroup == "Project") ? $scope.projectLabel : defaultGroup;
										
										$scope.updateViewBy(defaultGroup);
										$scope.updateOrderBy(globalSettings.currPreferences.Settings.Task.taskBoardOrder);
								});
						})
					}
				)

		});
		
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
					deferred.resolve(true);
			});    
							
			return deferred.promise;
		}
        
        $scope.populateProjects = function() {
	        var deferred = $q.defer();
	        
	        projectService.getAllProjects().then(
		        function(projects) {
					$scope.allProjects = projects;

			        var tmp = projects.map(function(proj) {
			            return {label:proj.title, code:proj.$id, active:false, isSelected:false, isDone:proj.isDone}
			        });
			        
			        tmp.push({label:projectService.notAssigned.title, code:'!', active:false, isSelected:false, isDone:false});
			        
			        var owner = globalSettings.currProfile.person;
			        var tlen = $scope.taskList.length;
			        var plen = tmp.length;
			        
			        for (var i=0; i<plen; i++) {
				        for (var j=0; j<tlen; j++) {
					        if ($scope.taskList[j].ownerId == owner && $scope.taskList[j].projectId == tmp[i].code) {
						        tmp[i].active = true;
						        break;
					        } else if ($scope.taskList[j].projectId == null && tmp[i].code == '!') {
						        tmp[i].active = true;
						        break;
					        }
				        }
			        }
			        
			        $scope.projects = $filter('filter')(tmp, {isDone: false});
			        deferred.resolve(true);

		        }
	        )
	        
	        return deferred.promise;
		}
		
		$scope.populatePeople = function() {
		    peopleService.getAllPeople().then (
			    function(people) {
				    var tmp = [];
				    var owner = globalSettings.currProfile.person;
				    var filteredList = $filter('filter')($scope.taskList, {ownerId: owner, delegateId:'!!'});
				    var len = filteredList.length;
				    var person;
				    
				    for (var i=0; i<len; i++) {
					    person = peopleService.lookupPerson(filteredList[i].delegateId, people);
					    tmp.uniquePush(person);
				    }
				    
				    $scope.delegates = tmp;
				    $scope.team = people;
				    
				}
		    );
	    }
	    
	    $scope.toggleSelected = function(person) {
	        person.isSelected = (person.isSelected == null ? true : !person.isSelected);
	        
	        taskService.determineSelectedOwners();
        }             
        
        $scope.sortableOptions = {
            connectWith: ".connectList",
            disabled: false,
            taskId: null,
            dropId: null,
            update: function(event, ui) {
	            globalSettings.log("taskboard.service", "sortableOptions.update", "update");
	            
	            if (!ui.item.sortable.received &&
	            	ui.item.sortable.source[0] !== ui.item.sortable.droptarget[0]) {
	            	this.dropId = ui.item.sortable.droptarget[0].id.split(',');
	            	this.taskId = ui.item[0].id;
	            	
	            	globalSettings.log("taskboard.service", "sortableOptions.update", "update.dropId: " + this.dropId);
	            	globalSettings.log("taskboard.service", "sortableOptions.update", "update.taskId: " + this.taskId);
	            	
	            	globalSettings.log("taskboard.service", "sortableOptions.update", "cancel");
	            	ui.item.sortable.cancel();		            	
	            			            	
	            }
            },
            stop: function(event, ui) {
	            globalSettings.log("taskboard.service", "sortableOptions.stop", "stop");
	            
	            globalSettings.log("taskboard.service", "sortableOptions.stop", "stop.dropId: " + this.dropId);
	            globalSettings.log("taskboard.service", "sortableOptions.stop", "stop.taskId: " + this.taskId);
	            
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
            } else if (viewBy == $scope.projectLabel) {
               $scope.grouping = $scope.projects;
 
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
	        var owner = globalSettings.currProfile.person;
	        var result = {};
	        
            switch ($scope.viewByFld) {
                case 'Priority':
                    result =  {priority: val.code, ownerId: owner}; break;
                case 'Schedule':
                    result =  {state: val.label, ownerId: owner}; break;
                case $scope.projectLabel:
                    result =  {projectId: val.code, ownerId: owner}; break;
                default:
                    result =  {status: val.label, ownerId: owner};
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
                case $scope.projectLabel:
                    return $scope.viewByFld + ',project,' + val.code;
                default:
                    return $scope.viewByFld + ',status,' + val.label;
            }
        }
        
        $scope.toggleArchived = function() {
	        $scope.showArchived = !$scope.showArchived;
        }
        
        $scope.archiveTasks = function() {
	        var owner = globalSettings.currProfile.person;
	        
	        if (owner != null) {
		        var fltr = {ownerId: owner};
		        
		        taskService.archiveCompleted(fltr);
		    }

        }
        
        $scope.newTask = function() {
            $scope.nav.newTask();
        }
        
        $scope.openTaskDetails = function(taskItem) {
			if (!$scope.selectMode) {
				$scope.nav.openTaskDetails(taskItem.$id);
			} else {
				taskItem.selectedActionItem = !taskItem.selectedActionItem;
			}
        }
        
        $scope.determineSummaryData = function(taskSummary) {
            var summary = []; 
            
            switch ($scope.viewByFld) {
                case 'Priority':
                    summary = ($filter('filter')(taskSummary.details, {type:'priority'}));
                    break;
                case 'Schedule':
                    summary = ($filter('filter')(taskSummary.details, {type:'state'}));
                    break;
                case $scope.projectLabel:
                    summary = ($filter('filter')(taskSummary.details, {type:'project'}));
                    break;
                default:
                	summary = ($filter('filter')(taskSummary.details, {type:'status'}));
            }
            
            return summary;
        }
        
        $scope.determineSummaryColors = function (summary) {
    		var colors = $scope.gs.pref.colors;
    		
    		for (var i=0; i<summary.length; i++) {
    			summary[i].color = colors[i];
    		}
    		
		}
		
		$scope.getTotalChecklistDone = function(items) {
	        var total = 0;
	        
	        if (items) {
	        	total = ($filter('filter')(items, {isDone:true})).length;
	        }
	        
	        return total;
        }
        
        
        $scope.buildSummary = function() {
	        insightsService.calculateTaskBoardSummary($scope.taskList, globalSettings.currProfile.person).then(
		        function(taskSummary) {
			        $scope.sumLegend = $scope.determineSummaryData(taskSummary);
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

		$scope.assignOwnerToTask = function(task, person) {
			task.ownerId = person.$id;
			task.owner = person;
		}

		$scope.assignProjectToTask = function(task, project) {
			var proj = $scope.allProjects.$getRecord(project.code);

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