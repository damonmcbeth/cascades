(function() {
    'use strict';

    var app = angular.module('app');
	
	app.factory('insightsService', ['$filter', '$q', '$rootScope', 'globalSettings', '$firebaseObject', '$firebaseArray', 
		function($filter,  $q, $rootScope, globalSettings, $firebaseObject, $firebaseArray) {
		
		function InsightsService() {
			var self = this;
			
			//Attributes
			self.taskSummary = null;			
			self.cached = false;
			
			self.getTaskSummary = function() {
			    var deferred = $q.defer();
			    
				if (self.cached && !globalSettings.shouldClearCache("insightsSer_TaskSumary")) {
					deferred.resolve(self.taskSummary);
				} else {
					globalSettings.initSettings().then(
						function() {
							if (!self.cached || globalSettings.shouldClearCache("insightsSer_TaskSumary")) {
								var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id 
													+ "/Summary/" + globalSettings.currProfile.person; 
								var workspaceRef = firebase.database().ref().child(lookupKey);
								
								self.taskSummary = $firebaseObject(workspaceRef);
								self.taskSummary.$loaded().then(
									function(data) {
										globalSettings.log("insights.service", "getTaskSummary", "TaskSummary Loaded");
										self.cached = true;
										globalSettings.setCache("insightsSer_TaskSumary");
										deferred.resolve(self.taskSummary);
										self.updateTaskSummary([globalSettings.currProfile.person]);
								});
							} else {
								deferred.resolve(self.taskSummary);
							}
					});
				};
				
				return deferred.promise;
			};
			
			self.getTasks = function() {
				var deferred = $q.defer();
				
				var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Tasks"; 
				var ref = firebase.database().ref().child(lookupKey);
				
				var tasks = $firebaseArray(ref);
				tasks.$loaded().then( 
					function(data) {
						deferred.resolve(tasks);
				});
				
				return deferred.promise;

			}
			
			self.getProjects = function() {
				var deferred = $q.defer();
				
				var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Projects"; 
				var ref = firebase.database().ref().child(lookupKey);
				
				var projects = $firebaseArray(ref);
				projects.$loaded().then( 
					function(data) {
						deferred.resolve(projects);
				});
				
				return deferred.promise;

			}
			
			self.getJournal = function() {
				var deferred = $q.defer();
				
				var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Journal"; 
				var ref = firebase.database().ref().child(lookupKey);
				
				var entries = $firebaseArray(ref);
				entries.$loaded().then( 
					function(data) {
						deferred.resolve(entries);
				});
				
				return deferred.promise;

			}
			
			self.getTasksForProject = function(projId) {
			    var deferred = $q.defer();
			    
				var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Tasks"; 
				var ref = firebase.database().ref().child(lookupKey).orderByChild("projectId").equalTo(projId);
				
				var tasks = $firebaseArray(ref);
				tasks.$loaded().then( 
					function(data) {
						deferred.resolve(tasks);
				});
				
				
				return deferred.promise;
			};
			
			self.getTaskSummaryForProject = function(projId) {
			    var deferred = $q.defer();
			    
				var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Summary/Project/" + projId; 
				var ref = firebase.database().ref().child(lookupKey);
				
				var summary = $firebaseObject(ref);
				summary.$loaded().then( 
					function(data) {
						deferred.resolve(summary);
				});
				
				
				return deferred.promise;
			};
			
			self.getTaskSummaryDetailsForProject = function(projId) {
			    var deferred = $q.defer();
			    
				var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Summary/Project/" + projId + "/details"; 
				var ref = firebase.database().ref().child(lookupKey);
				
				var summary = $firebaseArray(ref);
				summary.$loaded().then( 
					function(data) {
						deferred.resolve(summary);
				});
				
				
				return deferred.promise;
			};

			
			self.getAccessActivity = function() {
			    var deferred = $q.defer();
			    
				var personKey = globalSettings.currProfile.person;
				var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/UserActivity/" + personKey; 
				var ref = firebase.database().ref().child(lookupKey).orderByChild("state").equalTo("ACTIVE");
								
				var access = $firebaseArray(ref);
				access.$loaded().then( 
					function(data) {
						deferred.resolve(access);
				});
							
				
				return deferred.promise;
			};

				
			self.flushCache = function() {
				var deferred = $q.defer();
				
				self.cached = false;
				
				self.getTaskSummary().then(
					function(taskSumm) {
						deferred.resolve(true);
				});
				
				return deferred.promise;
			}
		     
		    self.updateTaskSummary = function(people, projects) {
			    var deferred = $q.defer();
			    
			    globalSettings.initSettings().then(
					function(cont) {
						var taskSum;
					    var i=0;
					    var len=people.length;
					    var lookupKey;
					    
					    self.getTasks().then(
							function(tasks) {
							    for (i=0; i<len; i++) {
								    taskSum = { total: 0,
										    	openTotal: 0,
										    	delegated: 0,
										    	dueToday: 0,
										    	dueSoon: 0,
										    	overdue: 0
								    		};
								    
								    self.calTaskSummaryForPerson(tasks, people[i], taskSum);
								    self.saveTaskSummary(people[i], taskSum);
								}
								
								if (projects != null) {
									len = projects.length;
									i=0;
									
									for (i=0; i<len; i++) {
										self.calProjectSummary(projects[i]);
									}
								}
							    
							    deferred.resolve(true);
						});
			    });
			    
			    return deferred.promise;
		    }
		    
		    self.saveTaskSummary = function(person, taskSum) {
			    var deferred = $q.defer();
			    
			    var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id 
									+ "/Summary/" + person + "/Task"; 
				var workspaceRef = firebase.database().ref().child(lookupKey);
				
				var summaryRef = $firebaseObject(workspaceRef);
				summaryRef.$loaded().then(
					function(data) {
						summaryRef.total = taskSum.total;
						summaryRef.openTotal = taskSum.openTotal;
						summaryRef.delegated = taskSum.delegated;
						summaryRef.dueToday = taskSum.dueToday;
						summaryRef.dueSoon = taskSum.dueSoon;
						summaryRef.overdue = taskSum.overdue;
						
						summaryRef.$save().then(
							function(ref) {
								deferred.resolve(self.taskSummary);
						});
				});
			    
			    return deferred.promise;
		    }
		    
		    self.calTaskSummaryForPerson = function(tasks, person, taskSum) {			    
				var filteredTasks = ($filter('filter')(tasks, {ownerId:person}));
				
				taskSum.total = filteredTasks.length;
				taskSum.openTotal = ($filter('filter')(filteredTasks, {isDone:false})).length; 
				taskSum.delegated = ($filter('filter')(filteredTasks, {delegateId:'', isDone:false})).length;
				
				taskSum.overdue = ($filter('filter')(filteredTasks, {state:'Overdue', isDone:false})).length;
			    taskSum.dueToday = ($filter('filter')(filteredTasks, {state:'Due today', isDone:false})).length;
			    taskSum.dueSoon = ($filter('filter')(filteredTasks, {state:'Due soon', isDone:false})).length;
			    
			    return taskSum;
		    }
		    
		    
		    self.calculateTaskBoardSummary = function(srcTasks, person) {
			    var deferred = $q.defer();
			    			    
		    	self.getProjects().then(
			    	function(projects) {
				    	var tasks = ($filter('filter')(srcTasks, {ownerId:person}));
						var taskSum = self.buildTaskSummary(tasks);
						
						var tot = tasks.length;
						var len = projects.length;
						var val;
						
						for (var i=0; i<len; i++) {
							val = ($filter('filter')(tasks, {projectId:projects[i].$id})).length;
							taskSum.details.push({type: 'project', order: i, label: projects[i].title, data: val, percent: self.calPercentage(val, tot)});
						}
						
						deferred.resolve(taskSum);
			    	}
		    	)
		    	
		    	return deferred.promise;
			    
		    };
		    
		    self.calculateUserJournalSummary = function(uid) {
			    var deferred = $q.defer();
			    			    
		    	self.getJournal().then(
			    	function(entries) {
				    	var total = ($filter('filter')(entries, {targetId:uid, status:'Unread'})).length;
						
						var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id 
									+ "/Summary/" + uid + "/Journal"; 
						var workspaceRef = firebase.database().ref().child(lookupKey);
						
						var summaryRef = $firebaseObject(workspaceRef);
						summaryRef.$loaded().then(
							function(data) {
								summaryRef.unread = total;
								
								summaryRef.$save().then(
									function(ref) {
										deferred.resolve(true);
								});
						});
			    	}
		    	)
		    	
		    	return deferred.promise;
		    }
		    
		    self.calculateUserProjectSummary = function(uid) {
			    var deferred = $q.defer();
			    			    
		    	self.getProjects().then(
			    	function(projects) {
				    	var total = ($filter('filter')(projects, {ownerId:uid, status:'Open'})).length;
						
						var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id 
									+ "/Summary/" + uid + "/Project"; 
						var workspaceRef = firebase.database().ref().child(lookupKey);
						
						var summaryRef = $firebaseObject(workspaceRef);
						summaryRef.$loaded().then(
							function(data) {
								summaryRef.open = total;
								
								summaryRef.$save().then(
									function(ref) {
										deferred.resolve(true);
								});
						});
			    	}
		    	)
		    	
		    	return deferred.promise;
		    }
		    
		    self.calPercentage = function(value, total) {
			    var result = 0;
			    
			    if (total > 0) {
				    result = value/total * 100;
			    }
			    
			    return result;
		    }
		    
		    self.buildTaskSummary = function(tasks) {
			    var taskSum = {};
			    var val;
			    var tot = tasks.length;
	
				taskSum.details = [];
				taskSum.total = tot;
				taskSum.openTotal = ($filter('filter')(tasks, {isDone:false})).length; 
				taskSum.compTotal = ($filter('filter')(tasks, {isDone:true})).length; 
				taskSum.perComp = (taskSum.total == 0) ? 0 : ((taskSum.compTotal/taskSum.total) * 100);
				taskSum.delegated = taskSum.openTotal - ($filter('filter')(tasks, {delegateId:null, isDone:false})).length;
				
				val = ($filter('filter')(tasks, {priority:'H'})).length;
				taskSum.details.push({type: 'priority', order: 1, label: 'High', data: val, percent: self.calPercentage(val, tot)});
				val = ($filter('filter')(tasks, {priority:'M'})).length;
				taskSum.details.push({type: 'priority', order: 2, label: 'Medium', data: val, percent: self.calPercentage(val, tot)});
				val = ($filter('filter')(tasks, {priority:'L'})).length;
				taskSum.details.push({type: 'priority', order: 3, label: 'Low', data: val, percent: self.calPercentage(val, tot)});
				val = ($filter('filter')(tasks, {priority:'N'})).length;
				taskSum.details.push({type: 'priority', order: 4, label: 'None', data: val, percent: self.calPercentage(val, tot)});							    
			    
			    val = ($filter('filter')(tasks, {state:'Overdue', isDone:false})).length;
			    taskSum.details.push({type: 'state', order: 1, label: 'Overdue', data: val, percent: self.calPercentage(val, tot)});
			    val = ($filter('filter')(tasks, {state:'Due today', isDone:false})).length;
			    taskSum.details.push({type: 'state', order: 2, label: 'Due today', data: val, percent: self.calPercentage(val, tot)});
			    val = ($filter('filter')(tasks, {state:'Due soon', isDone:false})).length;
			    taskSum.details.push({type: 'state', order: 3, label: 'Due soon', data: val, percent: self.calPercentage(val, tot)});
			    val = ($filter('filter')(tasks, {state:'Due later', isDone:false})).length;
			    taskSum.details.push({type: 'state', order: 4, label: 'Due later', data: val, percent: self.calPercentage(val, tot)});
			    val = ($filter('filter')(tasks, {state:'No due date', isDone:false})).length;
			    taskSum.details.push({type: 'state', order: 5, label: 'No due date', data: val, percent: self.calPercentage(val, tot)});
			    val = ($filter('filter')(tasks, {isDone:true})).length;
			    taskSum.details.push({type: 'state', order: 6, label: 'Done', data: val, percent: self.calPercentage(val, tot)});
			    
			    var tmp = globalSettings.currWorkspace.Settings.Task.states;
			    for (var i=0; i<tmp.length; i++) {
				    val = ($filter('filter')(tasks, {status:tmp[i].label})).length;
				    taskSum.details.push({type: 'status', order: tmp[i].order, label: tmp[i].label, data: val, percent: self.calPercentage(val, tot)});
			    }
			    
			    return taskSum;

		    }
		    
		    self.findProject = function(pid) {
			    var deferred = $q.defer();
			    
			    self.getProjects().then(
					function(projects) {
						deferred.resolve(projects.$getRecord(pid));				
					},
					function(result) {
						console.log("Failed to get the find project, result is " + result); 
						deferred.resolve(null);
      				}
				);
				
				return deferred.promise;
			};
		    
		    self.calProjectSummary = function(projId) { 
			    var deferred = $q.defer();
			    
			    self.findProject(projId).then(
				    function(project) {
					    self.getTasksForProject(projId).then(
						    function(tasks) {
							    var taskSum = self.buildTaskSummary(tasks);
							    							    
							    self.saveProjectSummary(project, taskSum).then(
								    function(r1) {
									    self.updateProjectPerComp(project, taskSum.perComp, taskSum.openTotal);
									    self.updateActiveAccessActivity(project, taskSum.perComp);
									    
									    deferred.resolve(true);
								    }
							    )
							    
							    
						    });
				    });
				    
				return deferred.promise;

		    }
		    
		    self.saveProjectSummary = function(project, summary) {
			    var deferred = $q.defer();
			    
			    var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id 
									+ "/Summary/Project/" + project.$id; 
				var workspaceRef = firebase.database().ref().child(lookupKey);
				
				var summaryRef = $firebaseObject(workspaceRef);
				summaryRef.$loaded().then(
					function(data) {
						summaryRef.total = summary.total;
						summaryRef.openTotal = summary.openTotal;
						summaryRef.compTotal = summary.compTotal;
						summaryRef.perComp = summary.perComp;
						summaryRef.details = summary.details;
						
						summaryRef.$save().then(
							function(ref) {
								deferred.resolve(true);
						});
				});
			    
			    return deferred.promise;
		    }
		    
		    self.updateProjectPerComp = function(project, perComp, totalOpen) {
			    
			    if (project.perComp != perComp) {
				    self.getProjects().then(
					    function(projects) {
						    project.perComp = perComp;
						    project.totalOpenTasks = totalOpen;
						    projects.$save(project);
					    }
				    )
			    }
		    }
		    
		    self.updateActiveAccessActivity = function(project, perComp) {
			    self.getAccessActivity().then(
				    function(act) {
					    var projectAct = ($filter('filter')(act, {targetType: "Project", targetId: project.$id, state:"ACTIVE"}));
					    var proj;
					    
					    var len = projectAct.length;
					    for (var i=0; i<len; i++) {
						    proj = projectAct[i];
						    proj.perComp = perComp;
						    
						    act.$save(proj);
					    }
				    }
			    )
		    }

		}
		
		return new InsightsService();
	}]);
}());