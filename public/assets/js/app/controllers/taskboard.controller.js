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
        
        $scope.taskList = [];
        $scope.activeProjects = [];
        $scope.delegates = [];
        
        globalSettings.initSettings().then(
        	function() {
	        	$scope.taskAliasPural = globalSettings.currWorkspace.Terminology.taskAliasPlural;
				$scope.taskAlias = globalSettings.currWorkspace.Terminology.taskAlias;
				$scope.projectLabel = globalSettings.currWorkspace.Terminology.projectAlias;
	        	
	        	$scope.taskStates = taskService.getTaskStates();
		        $scope.priorities = taskService.priorities;
		        $scope.taskSchedule = taskService.taskSchedule;
		        $scope.taskSummary = taskService.taskSummary;
		        
		        $scope.grouping = $scope.taskStates;
        
		        $scope.viewByFld = 'Status';
		        $scope.orderByFld = 'due';
		        
		        $scope.taskTotal = 0;
		        
		        $scope.today = new Date();
		        $scope.disabledDD = false;
		        
		        $scope.sumData = [];
		        $scope.sumLabel = [];
		        $scope.sumLegend = [];
		        $scope.chartOptions = { colors : globalSettings.pref.colors };
	        	
	        	$scope.populateTasks().then(
		        	function(cont) {
			        	$scope.populateProjects().then(
				        	function(projLoaded) {
					        	$scope.populatePeople();
	        	
					        	var defaultGroup = globalSettings.currPreferences.Settings.Task.taskBoardGroup;
						        defaultGroup = (defaultGroup == "Project") ? $scope.projectLabel : defaultGroup;
						        
						        $scope.updateViewBy(defaultGroup);
						        $scope.updateOrderBy(globalSettings.currPreferences.Settings.Task.taskBoardOrder);
				        });
		        	}
	        	)
	        	
        });
        
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
			        var tmp = projects.map(function(proj) {
			            return {label:proj.title, code:proj.$id, active:false, isSelected:false}
			        });
			        
			        tmp.push({label:projectService.notAssigned.title, code:'!', active:false, isSelected:false});
			        
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
			        
			        $scope.projects = tmp;
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
            $scope.nav.openTaskDetails(taskItem.$id);
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
         
        
        taskService.registerController($scope.buildSummary);
    
    }
}());