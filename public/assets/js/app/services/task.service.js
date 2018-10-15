(function() {
    'use strict';

    var app = angular.module('app');
	
	app.factory('taskService', ['$filter', '$http', '$q', '$rootScope', 'globalSettings', 'projectService', 
								'tagService', 'insightsService', 'peopleService', 'messageService', '$firebaseArray', 
								function($filter, $http, $q, $rootScope, globalSettings, projectService, 
										tagService, insightsService, peopleService, messageService, $firebaseArray) {
		
		function TaskService() {
			var self = this;
			
			//Attributes
			self.allTasks = [];
			
			self.cached = false;
			
			self.TASKS_UPDATED = "TASKS_UPDATED";
			
			self.priorities = [
		    	{label: 'High', code: 'H'},
				{label: 'Medium', code: 'M'},
        		{label: 'Low', code: 'L'},
        		{label: 'None', code: 'N'}
        	];

		    self.taskSchedule = ('Overdue,Due today,Due soon,Due later,No due date,Done').split(',').map(function(state) {
		        return {label: state};
		    });
	    
		    self.taskSummary = {
		    	status: {},
		    	state: {},
		    	priority: {},
		    	project: {},
		    	delegated: 0,
		    	total: 0,
		    	openTotal: 0
	    	};
		
			//Getters
			
			self.translatePriority = function(code) {
				var result = code;
				var list = self.priorities; 
				var len = list.length;
				
				for (var i=0; i<len; i++) {
					if (list[i].code == code) {
						result = list[i].label;
						break;
					}
				}
				
				return result;
			}
			
			self.getTaskStates = function() {
				var deferred = $q.defer();

				globalSettings.retrieveWorkspaceTaskStatus().then(
					function(list) {
						var taskStatusList = $filter('orderBy')(list,'order');
						deferred.resolve(taskStatusList);
					}
				)

				return deferred.promise;
			}
			
			self.getAllTasks = function() {
			    var deferred = $q.defer();
			    
				if (self.cached && !globalSettings.shouldClearCache("taskSer_Tasks")) {
					deferred.resolve(self.allTasks);
				} else {
					globalSettings.initSettings().then(
						function() {
							if (!self.cached || globalSettings.shouldClearCache("taskSer_Tasks")) {
								var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Tasks"; 
								var ref = firebase.database().ref().child(lookupKey);
								
								self.allTasks = $firebaseArray(ref);
								self.allTasks.$loaded().then( 
									function(data) {
										globalSettings.log("task.service", "getAllTasks", "Tasks Loaded");
										self.cached = true;
										globalSettings.setCache("taskSer_Tasks");
										self.determineState(self.allTasks);
										deferred.resolve(self.allTasks);
								});
							} else {
								deferred.resolve(self.allTasks);
							}

						});
				};
				
				return deferred.promise;
			};
			
			self.getTasksForPerson = function(projId) {
			    var deferred = $q.defer();
			    
				globalSettings.initSettings().then(
					function() {
						var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Tasks"; 
						var ref = firebase.database().ref().child(lookupKey).orderByChild("relatedId").equalTo(projId);
						
						var tasks = $firebaseArray(ref);
						tasks.$loaded().then( 
							function(data) {
								deferred.resolve(tasks);
					});
				});
				
				return deferred.promise;
			};


			self.getTasksForProject = function(projId) {
			    var deferred = $q.defer();
			    
				globalSettings.initSettings().then(
					function() {
						var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Tasks"; 
						var ref = firebase.database().ref().child(lookupKey).orderByChild("projectId").equalTo(projId);
						
						var tasks = $firebaseArray(ref);
						tasks.$loaded().then( 
							function(data) {
								deferred.resolve(tasks);
					});
				});
				
				return deferred.promise;
			};
				
			self.flushCache = function() {
				var deferred = $q.defer();
				
				self.cached = false;
				
				self.getAllTasks().then(
					function(tasks) {
						deferred.resolve(true);
				});
				
				return deferred.promise;
			}
			
			self.isDate = function(val) {
			    var d = new Date(val);
			    return !isNaN(d.valueOf());
			};
				
			self.initTags = function(people) {
			    var deferred = $q.defer();
				
				tagService.populateTags(people, "tagIds", "tags").then(
					function(done) {
						deferred.resolve(true);
					}
				);
				
				return deferred.promise;
		    };
		    
		    self.populateDetails = function(tasks) {
			    var len = tasks.length;
						
				for (var i=0; i<len; i++) {
					self.assignPerson(tasks[i], tasks[i].ownerId, "owner");
					self.assignPerson(tasks[i], tasks[i].delegateId, "delegate");
					self.assignPerson(tasks[i], tasks[i].relatedId, "related");
					self.assignPerson(tasks[i], tasks[i].createdById, "createdBy");
					self.assignPerson(tasks[i], tasks[i].lastUpdatedById, "lastUpdatedBy");
					
					self.assignProject(tasks[i]);
					
					if (tasks[i].due != null) {
						if (self.isDate(tasks[i].due)) {
							tasks[i].due = new Date(tasks[i].due);
						} else {
							tasks[i].due = eval(tasks[i].due);
						}
					}
					
					tasks[i].created = eval(tasks[i].created);
					tasks[i].lastUpdated = eval(tasks[i].lastUpdated);
					
				}
			};
			
			self.assignProject = function(task) {
				projectService.findProject(task.projectId).then(
					function(project) {
						task.project = project;
						if (project != null) {
							project.projTasks.push(task);
						}
				});	
			}
			
			self.assignPerson = function(task, uid, fld) {
				peopleService.findPerson(uid).then(
					function(person) {
						task[fld] = person;
				});	
			};
		    
		    self.findTask = function(taskId) {
			    var deferred = $q.defer();
			    
			    self.getAllTasks().then(
					function(tasks) {
						deferred.resolve(self.lookupTask(taskId, tasks));			
					},
					function(result) {
						console.log("Failed to get the find task, result is " + result); 
						deferred.resolve(null);
      				}
				);
				
				return deferred.promise;
			};
			
			self.lookupTask = function(taskId, tasks) {
				var result = tasks.$getRecord(taskId);
				
				return result;
			}
			
		    self.cloneTask = function (src, dest) {
			    var deferred = $q.defer();
			    
			    if (src == null) {
				    deferred.resolve(null);
			    } else {
				    var result = (dest == null) ? this.newTask() : dest;
					
					result.title = src.title;
		            result.due = src.due  == undefined ? null : new Date(src.due);
		            result.priority = src.priority;
		            result.status = src.status;
		            result.$id = src.$id;
		            result.notes = src.notes;
					result.ownerId = src.ownerId == undefined ? null : src.ownerId;
					result.relatedId = src.relatedId == undefined ? null : src.relatedId;
		            result.delegateId = src.delegateId == undefined ? null : src.delegateId;
		            result.start = src.start == undefined ? null : new Date(src.start);
		            result.state = src.state;
		            result.projectId = src.projectId == undefined ? null : src.projectId;
		            result.isDone = src.isDone;
		            result.created = src.created;
		            result.createdName = src.createdName;
		            result.updated = src.updated;
		            result.updatedName = src.updatedName;
		            result.archive = src.archive;
		            result.hasChecklist = src.hasChecklist;
		            
		            self.cloneChecklist(src , result);
		            
		            self.initTask(result).then(
			            function(task) {
				            deferred.resolve(task);
			        });
	            }
	            
	            return deferred.promise;
		    };
		    
		    self.initTask = function(task) {
			    var deferred = $q.defer();
			    
		        peopleService.findPerson(task.ownerId).then(
					function(owner) {
						task.owner = owner;
						
						peopleService.findPerson(task.delegateId).then(
							function(delegate) {
								task.delegate = delegate;
								
								peopleService.findPerson(task.relatedId).then(
									function(related) {
										task.related = related;
										
										projectService.findProject(task.projectId).then(
											function(project) {
												task.project = project;
												deferred.resolve(task);
		
										});	
								});

						});
				});
		        
		        return deferred.promise;
	        }
		    
		    self.cloneChecklist = function (src, dest) {
			    var len = src.checklist == null ? 0 : src.checklist.length;
			    var tmp;
			    var result = [];
			    
			    for (var i=0; i<len; i++) {
				    tmp = {
					    isDone: src.checklist[i].isDone,
		    			title: src.checklist[i].title
				    }
				    result.push(tmp);
			    }
			    
			    dest.checklist = result;
			    
		    }
		    
		    self.newTask = function() {
				var result = {
								title: '',
					            due: null,
					            priority: 'N',
					            status: 'Not Started',
					            project: '',
					            notes: '',
					            ownerId: globalSettings.currProfile.person,
								owner: null,
								relatedId: null,
								related: null,
					            delegateId: null,
					            delegate: null,
					            start: null,
					            state: '',
					            isDone: false,
					            tags: [],
					            checklist: [],
								hasHighlightTag: false,
								archived: false,
								hasChecklist: false
			
							};			
				
				return result;
			};
			
			self.registerController = function(funct) {
				$rootScope.$on(self.TASKS_UPDATED, funct);
			};
			
			self.broadcastChange = function() {
				$rootScope.$broadcast(self.TASKS_UPDATED);  
		    };
		    
		    self.deleteTask = function (src) {
			    var deferred = $q.defer();
				
				self.getAllTasks().then(
					function(tasks) {
						var task = tasks.$getRecord(src.$id);
						tasks.$remove(task);
						
						deferred.resolve(true);
					}
				);
				
				return deferred.promise;
		    };
		    
		    self.saveTask = function (edited, orig) {
				var deferred = $q.defer();
				var origOwnerId = (orig == null) ? null : orig.ownerId;
			    var origDelegateId = (orig == null) ? null : orig.delegateId;
			    
				
				if (edited.status == 'Done') { 
				    edited.isDone = true;   
			    } else {
				    edited.isDone = false;   
			    }
			    			    
			    if (edited.status != 'Not Started' && (edited.start == undefined || edited.start == null || edited.start == '')) {
				    edited.start = new Date();
			    }
			    
			    var people = self.buildUserSummaryList(orig, edited);
			    var projects = self.buildProjectSummaryList(orig, edited);
			    
			    //self.handleProjectChange(edited, orig);
			    
				self.getAllTasks().then(
					function(tasks) {
						if (orig == null) {
							tasks.$add(self.createTaskForSave(edited)).then(
								function(ref) {
								  globalSettings.log("task.service", "saveTask", "Added task: " +  ref.key);
								  edited.$id = ref.key;
								  tagService.saveTagsForItem(ref.key, tagService.TYPE_TASKS, edited.tags);
								  
								  self.determineState(tasks);
								  self.notifyOwner(edited);
								  self.notifyDelegate(edited);
								  self.determineHighlightTasks();
								  self.broadcastChange();
								  deferred.resolve(orig);
								  
								  self.updateTaskSummary(people, projects);
								}, 
								function(error) {
								  globalSettings.logError("task.service", "saveTask:Create", error);
								  deferred.resolve(orig);
							});
						} else {
							var task = self.updateOrigTaskForSave(edited, tasks);
					    	tasks.$save(task).then(
					    		function(ref) {
								  globalSettings.log("task.service", "saveTask", "Updated task: " +  ref.key);
								  tagService.saveTagsForItem(ref.key, tagService.TYPE_TASKS, edited.tags);
								  
								  self.determineState(tasks);
								  self.notifyOwner(edited, origOwnerId);
								  self.notifyDelegate(edited, origDelegateId);
								  self.determineHighlightTasks();
								  self.broadcastChange();
								  deferred.resolve(orig);
								  
								  self.updateTaskSummary(people, projects);
								}, 
								function(error) {
								  globalSettings.logError("task.service", "saveTask:Update", error);
								  deferred.resolve(orig);
							});
					    }
					}
				);
				
				return deferred.promise;
			};
			
			self.notifyOwner = function(edited, origOwnerId) {
			    if (edited.ownerId != null && (origOwnerId == null || edited.ownerId != origOwnerId)) {
					if (edited.owner.notificationToken != null) {
						var msg = edited.updatedName + " assigned you a task: " + edited.title;
						var icon = globalSettings.currProfile.avatar;
						icon = (icon == null) ? "/assets/img/Timeline-128.png" : icon;

						messageService.sendMessage(edited.owner.notificationToken, msg, icon);
					}
			    }
			}
			
			self.notifyDelegate = function(edited, origDelegateId) {
			    if (edited.delegateId != null && (origDelegateId == null || edited.delegateId != origDelegateId)) {
					if (edited.delegate.notificationToken != null) {
						var msg = edited.updatedName + " assigned you a task: " + edited.title;
						var icon = globalSettings.currProfile.avatar;
						icon = (icon == null) ? "/assets/img/Timeline-128.png" : icon;

						messageService.sendMessage(edited.owner.notificationToken, msg, icon);
					}
			    }
		    }
		    
		    self.buildProjectSummaryList = function(origTask, editedTask) {
			    var projects = [];
			    
			    if (origTask != null) {
			    	projects.uniquePush(origTask.projectId);
			    }
			    
			    if (editedTask != null) {
			    	projects.uniquePush(editedTask.projectId);
				}
				
				return projects;
			}
		    
		    self.buildUserSummaryList = function(origTask, editedTask) {
			    var people = [];
			    
			    if (origTask != null) {
			    	people.uniquePush(origTask.ownerId);
			    	people.uniquePush(origTask.delegateId);
			    }
			    
			    if (editedTask != null) {
			    	people.uniquePush(editedTask.ownerId);
			    	people.uniquePush(editedTask.delegateId);
				}
				
				return people;
			}
		    
		    self.updateTaskSummary = function(people, projects) {			    
				insightsService.updateTaskSummary(people, projects);
		    }
		    
		    self.createTaskForSave = function(src) {
			    var result = {
				    			title: src.title,
				    			due: src.due == null ? null : src.due.getTime(),
				    			start: src.start == null ? null : src.start.getTime(),
								priority: src.priority,
								status: src.status,
								notes: src.notes,
								ownerId: src.ownerId,
								ownerName: src.owner == null ? null : src.owner.name,
								relatedId: src.relatedId,
								relatedName: src.related == null ? null : src.related.name,
								delegateId: src.delegateId,
								delegateName: src.delegate == null ? null : src.delegate.name,
								projectId: src.projectId,
								projectName: src.project == null ? null : src.project.title,
								isDone: src.isDone,
								checklist: src.checklist,
								hasChecklist: src.hasChecklist,
								state: src.state
							};
							
				globalSettings.updateTimestamp(result);			
	            
	            return result;
		    }
		    
		    self.updateOrigTaskForSave = function(src, tasks) {
			    var result = tasks.$getRecord(src.$id);
			    			    
			    result.title = src.title;
	            result.due = src.due == null ? null : src.due.getTime();
	            result.priority = src.priority;
	            result.status = src.status;
	            result.notes = src.notes;
	            result.ownerId = src.ownerId;
				result.ownerName = (src.owner == "" || src.owner == null) ? null : src.owner.name;
				result.relatedId = src.relatedId;
	            result.relatedName = (src.related == "" || src.related == null) ? null : src.related.name;
	            result.delegateId = src.delegateId;
	            result.delegateName = (src.delegate == "" || src.delegate == null) ? null : src.delegate.name;
	            result.start = src.start == null ? null : src.start.getTime();
	            result.projectId = src.projectId;
	            result.projectName = (src.project == "" || src.project == null) ? null : src.project.title;
	            result.isDone = src.isDone;
	            result.state = src.state;
	            result.hasHighlightTag = false;
	            result.hasSelectedOwner = false;
	            result.hasChecklist = src.hasChecklist == null ? false : src.hasChecklist;
	            result.checklist = src.checklist;
				result.tags = null;
				result.selectedActionItem = null;
	            
	            globalSettings.updateTimestamp(result);
	            
	            return result;
		    }
		    
		    self.handleProjectChange = function(edited, orig) {
			    
			    if (orig == null) {
				    if (edited.project != null) {
						edited.project.projTasks.push(edited);
					}
			    } else {
				    if (edited.project != orig.project) {
					    if (orig.project != null) {
						    var tasks = orig.project.projTasks;
						    tasks.splice(tasks.indexOf(orig), 1);
					    }
					    
					    if (edited.project != null) {
							edited.project.projTasks.push(orig);
						}
					    
				    }
			    }	    
		    }
		    
		    self.updateStatus = function(orig, isDone) {
			    var deferred = $q.defer();
				
				var people = self.buildUserSummaryList(orig, null);
				var projects = self.buildProjectSummaryList(orig, null);
				
				self.cloneTask(orig, null).then(
					function(edited) {
						if (isDone == undefined) {
					    	if (edited.status == 'Done') {
							    edited.isDone = true;
					    	} else {
							    edited.isDone = false;
					    	}
					    } else {
						    if (isDone) {
							    edited.status = 'Done';
						    } else {
							    edited.status = 'In Progress';
						    }
					    }
					    
					    if (edited.status != 'Not Started' &&  edited.start == null) {
							edited.start = new Date();
						}
						
						self.getAllTasks().then(
							function(tasks) {
								var task = self.updateOrigTaskForSave(edited, tasks);
						    	
						    	tasks.$save(task).then(
						    		function(ref) {
									  globalSettings.log("task.service", "updateStatus", "Updated task status: " +  ref.key);
									  self.determineState(tasks);
									  self.determineHighlightTasks();
									  self.broadcastChange();
									  deferred.resolve(true);
									  
									  self.updateTaskSummary(people, projects);
									}, 
									function(error) {
									  globalSettings.logError("task.service", "updateStatus", error);
									  deferred.resolve(false);
								});
							}
						);
				});
				
				return deferred.promise;
			};
			
			self.archiveCompleted = function(filter) {
				self.getAllTasks().then(
					function(tasks) {
						filter.isDone = true;
						
						var filteredList = $filter('filter')(tasks, filter);
						var len = filteredList.length;
						
						var wsKey = globalSettings.currWorkspace.$id;
						var updates = {};
						var ids = "";
						var cnt = 0;
						
						for (var i=0; i<len; i++) {
							if (filteredList[i].archived != true) {
								updates["/App/Workspaces/" + wsKey + "/Tasks/" + filteredList[i].$id + "/archived"] = true;
								ids += filteredList[i].$id + "; ";
								cnt++;
							}
						}
						
						firebase.database().ref().update(updates).then(
							function(result) {
								globalSettings.log("task.service", "archiveCompleted", cnt + " Tasks archived: " + ids);
								globalSettings.showSuccessToast("Archive completed");
							}
						);
						
					}
				)			
			}
		    
		    self.determineState = function(tasks) {
		    	var bod = moment().startOf('day');
				var eod = moment().endOf('day');
				var soon = moment().add(globalSettings.currPreferences.Settings.Task.soon, 'days');
		    	var prev = "";
		    	var task = null;
		    	var due = null;
		    	
			    for (var i=0; i<tasks.length; i++) {
				    task = tasks[i];
				    prev = task.state;
				    due = (task.due == undefined || task.due == null) ? null : moment(task.due);
				    
					if (task.isDone) {
						task.state = 'Done';
					} else if (due == null) {
						task.state = 'No due date';
					} else if (due < bod) {
						task.state = 'Overdue';
					} else if (due >= bod && due <= eod) {
						task.state = 'Due today';
					} else if (due < soon) {
						task.state = 'Due soon';			
					} else {
						task.state = 'Due later';
					}
					
					if (prev != task.state) {
						tasks.$save(task).then(
				    		function(ref) {
							  globalSettings.log("task.service", "determineState", "Task: " + ref.key + " updated state to '" + task.state + "'");
							}, 
							function(error) {
							  globalSettings.logError("task.service", "determineState", error);
						});
					}
				}
		    };
		    
		    
		    self.determineHighlightTasks = function() {
				var found = false;
				
				tagService.getAllTags().then(
					function(tags) {
						var tag;
						var srcTag;
						
						self.getAllTasks().then(					
							function(tasks) {
								var len = tasks.length;
								var task;
								
								for (var i=0; i<len; i++) {
									task = tasks[i];
									found = false;
									
									if (task.tags != undefined) {
										angular.forEach(task.tags, function(value, key) {
											srcTag = tagService.lookupTags(key, tags);
											if (srcTag != null && srcTag.isHighlighted) {
												found = true;
												return;
											}
										});
									}
									
									task.hasHighlightTag = found;
								}
						});
				})
			};
			
			self.determineSelectedOwners = function() {
				peopleService.getAllPeople().then(
					function(people) {
						self.getAllTasks().then(					
							function(tasks) {
								var len = tasks.length;
								var task;
								var resultArr;
								var person
								
								for (var i=0; i<len; i++) {
									task = tasks[i];
									
									if (task.ownerId != undefined) {
										resultArr = $filter('filter')(people, {$id:task.ownerId}, true);
						
										if (resultArr.length == 1) {
											person = resultArr[0];
											task.hasSelectedOwner = (person != null && person.isSelected);
										} else {
											task.hasSelectedOwner = false;
										}
										
									} else {
										task.hasSelectedOwner = false;
									}
									
									if (!task.hasSelectedOwner && task.delegateId != undefined) {
										resultArr = $filter('filter')(people, {$id:task.delegateId}, true);
						
										if (resultArr.length == 1) {
											person = resultArr[0];
											task.hasSelectedOwner = (person != null && person.isSelected);
										} else {
											task.hasSelectedOwner = false;
										}
									}
								}
						});
				});
			};


		}
		
		return new TaskService();
	}]);
}());