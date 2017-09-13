(function() {
    'use strict';

    var app = angular.module('app');
    
    
    app.factory('projectService', ['$http', '$q', '$filter', 'globalSettings', 'tagService', 'peopleService', 'insightsService', '$firebaseArray',  
    	function($http, $q, $filter, globalSettings, tagService, peopleService, insightsService, $firebaseArray) {
		
		function ProjectService() {
			var self = this;
			
			//Attributes
			self.allProjects = [];
			self.projectTypes = null;
			
			self.cached = false;
			
			self.notAssigned = {
	            $id: null,
	            title: 'Not assigned',
	            notes: '',
	            status: 'Open',
	            start: new Date(),
	            end: new Date(),
	            projTasks: [],
	            people: [],
	            docs: [],
	            ownerNanme: null,
	            ownerId: null,
	            perComp: 0,
	            revenue: 0,
	            typeName: "",
	            typeId: null,
	            tags: []
	     	}
		
			//Getters
			self.getAllProjects = function() {
			    var deferred = $q.defer();
			    
				if (self.cached && !globalSettings.shouldClearCache("projectSer_Projects")) {
					deferred.resolve(self.allProjects);
				} else {
					globalSettings.initSettings().then(
						function() {
							if (!self.cached || globalSettings.shouldClearCache("projectSer_Projects")) {
								var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Projects"; 
								var ref = firebase.database().ref().child(lookupKey);
								
								self.allProjects = $firebaseArray(ref);
								self.allProjects.$loaded().then( 
									function(data) {
										globalSettings.log("project.service", "getAllProjects", "Projects Loaded");
										self.cached = true;
										globalSettings.setCache("projectSer_Projects");
										deferred.resolve(self.allProjects);
								});
							} else {
								deferred.resolve(self.allProjects);
							}

						});
				};
				
				return deferred.promise;
			};
			
			self.getProjectTypes = function() {
			    var deferred = $q.defer();
			    
			    if (self.projectTypes != null && !globalSettings.shouldClearCache("projectSer_ProjectTypes")) {
				    deferred.resolve(self.projectTypes);
			    } else {
					globalSettings.initSettings().then(
						function() {
							var lookupKey = "Workspaces/" + globalSettings.currWorkspace.$id + "/Settings/Project/types"; 
							var ref = firebase.database().ref().child(lookupKey);
							
							self.projectTypes = $firebaseArray(ref);
							self.projectTypes.$loaded().then( 
								function(data) {
									globalSettings.setCache("projectSer_ProjectTypes");
									deferred.resolve(self.projectTypes);
							});
					});
				}
				
				return deferred.promise;
			};
			
			
			//Methods
			self.flushCache = function() {
				var deferred = $q.defer();
				
				self.allProjects.clear();
				self.cached = false;
				
				self.getAllProjects().then(
					function(projects) {
						deferred.resolve(true);
				});
				
				return deferred.promise;
			}
		    
		    self.populateDetails = function(projects) {
			    var len = projects.length;
			    var projTypes = globalSettings.pref.project.types;
			    var projTypesLen = projTypes.length;
			    var peopleLen = 0;
						
				for (var i=0; i<len; i++) {
					projects[i].isDone = (projects[i].status == "Done");
					
					self.assignPerson(projects[i], projects[i].ownerId, "owner");
					self.assignPerson(projects[i], projects[i].createdById, "createdBy");
					self.assignPerson(projects[i], projects[i].lastUpdatedById, "lastUpdatedBy");
					
					projects[i].start = eval(projects[i].start);
					projects[i].end = eval(projects[i].end);
					projects[i].created = eval(projects[i].created);
					projects[i].lastUpdated = eval(projects[i].lastUpdated);
					
					for (var j=0; j<projTypesLen; j++) {
						if (projects[i].typeId == projTypes[j].id) {
							projects[i].type = projTypes[j];
							break;
						}
					}
					
					peopleLen = projects[i].peopleId.length;
					for (var k=0; k<peopleLen; k++) {
						self.addPerson(projects[i], projects[i].peopleId[k]);
					}
					
				}
			};
			
			self.determineProgress = function(project) {
				var deferred = $q.defer();
			    
			    self.getAllProjects().then(
				    function(projects) {
					    /*var len = projects.length;
					    var compTask = 0;
					    var totTasks = 0;
						
						for (var i=0; i<len; i++) {
					        compTask = $filter('filter')(projects[i].projTasks, {isDone:true}, true).length;
					        totTasks = projects[i].projTasks.length;
					        
					        if (totTasks == 0) {
						        projects[i].perComp = 0;
					        } else {
					        	projects[i].perComp = (compTask/totTasks) * 100; 
					        }
				        }*/
				    }
				);
				
				return deferred.promise;
	        }
			
			self.addPerson = function(project, uid) {
				peopleService.findPerson(uid).then(
					function(person) {
						project.people.push(person);
				});	
			};
			
			self.assignPerson = function(project, uid, fld) {
				peopleService.findPerson(uid).then(
					function(person) {
						project[fld] = person;
				});	
			};
			
			self.newProject = function() {
				var result = {
		            title: '',
		            notes: '',
		            status: 'Open',
		            start: new Date(),
		            end: moment().add(1, 'months').toDate(),
		            people: [],
		            peopleId: [],
		            ownerId: globalSettings.currProfile.person,
		            typeId: 0,
		            type: null,
		            tags: [],
		            perComp: 0,
		            revenue: 0,
		            isDone: false
				};
				
				return result;
			};
			
			self.cloneProject = function (src, dest) {
				 var deferred = $q.defer();
			    
			    if (src == null) {
				    deferred.resolve(null);
			    } else {
				    var result = (dest == null) ? self.newProject() : dest;
					
					result.$id = src.$id;
					result.title = src.title;
		            result.notes = src.notes;
		            result.status = src.status;
		            result.start = src.start == undefined ? new Date() : new Date(src.start);
		            result.end = src.end == undefined ? null : new Date(src.end);
		            result.ownerId = src.ownerId == undefined ? null : src.ownerId;
		            result.ownerName = src.ownerName == undefined ? null : src.ownerName;
		            result.typeId = src.typeId;
		            result.typeName = src.typeName;
		            result.perComp = src.perComp;
		            result.revenue = src.revenue;
		            result.isDone = src.isDone;
		            result.created = src.created;
		            result.createdName = src.createdName;
		            result.updated = src.updated;
		            result.updatedName = src.updatedName;
		            
		            self.initProject(result).then(
			            function(proj) {
				            deferred.resolve(proj);
			        });
	            }
	            
	            return deferred.promise;
		    };
		    
		    self.initProject = function(project) {
			    var deferred = $q.defer();
			    
			    self.getProjectTypes().then(
				    function(types) {
					    if (project.typeId != null) {
						    var len = types.length;
						    
						    for (var i=0; i<len; i++) {
							    if (types[i].$id == project.typeId) {
								    project.type = types[i];
								    break;
							    }
						    }
					    }
					    
					    peopleService.findPerson(project.ownerId).then(
							function(owner) {
								project.owner = owner;
								deferred.resolve(project);
						});
				})
			    
		        return deferred.promise;
	        }

			
			self.findProject = function(pid) {
			    var deferred = $q.defer();
			    
			    self.getAllProjects().then(
					function(projects) {
						deferred.resolve(self.lookupProject(pid, projects));				
					},
					function(result) {
						console.log("Failed to get the find project, result is " + result); 
						deferred.resolve(null);
      				}
				);
				
				return deferred.promise;
			};
			
			self.lookupProject = function(projId, projects) {
				var result = projects.$getRecord(projId);
				
				return result;
			}		    
		    
		    self.saveProject = function (edited, orig) {
				var deferred = $q.defer();
				var origOwnerId = (orig == null) ? null : orig.ownerId;
			    
			    self.getAllProjects().then(
					function(projects) {
						if (orig == null) {
							projects.$add(self.createProjectForSave(edited)).then(
								function(ref) {
								  globalSettings.log("project.service", "saveProject", "Added Project: " +  ref.key);
								  edited.$id = ref.key;
								  tagService.saveTagsForItem(ref.key, tagService.TYPE_PROJECTS, edited.tags);
								  peopleService.savePeopleForItem(ref.key, peopleService.TYPE_PROJECTS, edited.people);

								  self.notifyOwner(edited);
								  self.determineHighlightProjects();
								  deferred.resolve(orig);
								  
								}, 
								function(error) {
								  globalSettings.logError("project.service", "saveProject:Create", error);
								  deferred.resolve(orig);
							});
						} else {
							var project = self.updateOrigProjectForSave(edited, projects);
					    	projects.$save(project).then(
					    		function(ref) {
								  globalSettings.log("project.service", "saveProject", "Updated Project: " +  ref.key);
								  tagService.saveTagsForItem(ref.key, tagService.TYPE_PROJECTS, edited.tags);
								  peopleService.savePeopleForItem(ref.key, peopleService.TYPE_PROJECTS, edited.people);
								  
								  //self.calProjectSummary(edited.$id);
								  self.calculateSummary(origOwnerId, edited);
								  self.notifyOwner(edited, origOwnerId);
								  self.determineHighlightProjects();
								  deferred.resolve(orig);
								}, 
								function(error) {
								  globalSettings.logError("project.service", "saveProject:Update", error);
								  deferred.resolve(orig);
							});
					    }
					}
				);
				
				return deferred.promise;
			};
			
			//self.calProjectSummary = function(projId) {
			//	insightsService.calProjectSummary(projId);
			//}
			
			self.notifyOwner = function(edited, origOwnerId) {
			    if (edited.ownerId != null && (origOwnerId == null || edited.ownerId != origOwnerId)) {
					if (edited.owner.notificationToken != null) {
						var msg = edited.updatedName + " assigned you a project: " + edited.title;
						var icon = globalSettings.currProfile.avatar;
						icon = (icon == null) ? "/assets/img/Timeline-128.png" : icon;

						messageService.sendMessage(edited.owner.notificationToken, msg, icon);
					}
			    }
		    }

		    self.calculateSummary = function(origOwnerId, edited) {
			    if (edited.ownerId != null) {			    
			    	insightsService.calculateUserProjectSummary(edited.ownerId);
			    }
			    
			    if (edited.ownerId != origOwnerId && origOwnerId != null) {
				    insightsService.calculateUserProjectSummary(origOwnerId);
			    }
		    }
		    
		    self.createProjectForSave = function(src) {
			    var result = {
				    			title: src.title,
				    			start: src.start == null ? null : src.start.getTime(),
				    			end: src.end == null ? null : src.end.getTime(),
								status: src.status,
								notes: src.notes,
								ownerId: src.ownerId,
								ownerName: src.owner == null ? null : src.owner.name,
								typeId: src.type == null ? null : src.type.$id,
								typeName: src.type == null ? null : src.type.name,
								isDone: src.isDone,
								perComp: src.perComp,
								revenue: src.revenue,
								totalOpenTasks: 0,
								totalNotes: 0
							};
							
				globalSettings.updateTimestamp(result);			
	            
	            return result;
		    }
		    
		    self.updateOrigProjectForSave = function(src, projects) {
			    var result = projects.$getRecord(src.$id);
			    			    
			    result.title = src.title;
	            result.perComp = src.perComp;
	            result.status = src.status;
	            result.notes = src.notes == null ? null : src.notes;
	            result.ownerId = src.ownerId;
	            result.ownerName = (src.owner == "" || src.owner == null) ? null : src.owner.name;
	            result.typeId = src.type == null ? null : src.type.$id;
				result.typeName = src.type == null ? null : src.type.name;
	            result.start = src.start == null ? null : src.start.getTime();
	            result.end = src.end == null ? null : src.end.getTime();
	            result.revenue = src.revenue;
	            result.isDone = src.isDone;
	            result.hasHighlightTag = false;
	            result.tags = null;
	            result.people = null;
	            
	            globalSettings.updateTimestamp(result);
	            
	            return result;
		    }
		    
		    self.determineHighlightProjects = function() {
				var found = false;
				
				tagService.getAllTags().then(
					function(tags) {
						var tag;
						var srcTag;
						
						self.getAllProjects().then(					
							function(projects) {
								var len = projects.length;
								var project;
								
								for (var i=0; i<len; i++) {
									project = projects[i];
									found = false;
									
									if (project.tags != undefined) {
										angular.forEach(project.tags, function(value, key) {
											srcTag = tagService.lookupTags(key, tags);
											if (srcTag != null && srcTag.isHighlighted) {
												found = true;
												return;
											}
										});
									}
									
									project.hasHighlightTag = found;
								}
						});
				})
			};

		}
		
		return new ProjectService();
	}]);

}());