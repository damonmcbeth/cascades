 (function() {
    'use strict';

    var app = angular.module('app');
    
    		
	app.factory('activityService', ['$http', '$q', '$filter', '$rootScope', 'globalNav', 'peopleService', 'projectService', 
				'globalSettings', 'fireAuth', '$firebaseObject', 'taskService', '$firebaseArray',
				
				function($http, $q, $filter, $rootScope, globalNav, peopleService, projectService, globalSettings, 
							fireAuth, $firebaseObject, taskService, $firebaseArray) {
		
		function ActivityService() {
			var self = this;
			
			//Attributes
			self.activity = null;
			self.recent = null;
			self.access = null;
			
			self.TYPE_ACCESS = "ACCESS";
			self.TYPE_UPDATE = "UPDATE";
			self.TYPE_CREATE = "CREATE";
			self.TYPE_DELETE = "DELETE";
			self.TYPE_DONE = "DONE";
			self.TYPE_OWNER_CHANGE = "OWNER_CHANGE";
			self.TYPE_DELEGATE = "DELEGATE";
			self.TYPE_REOPEN = "REOPEN";
			
			self.TYPE_UPDATE_DATE = "UPDATE_DATE";
			self.TYPE_UPDATE_MONEY = "UPDATE_MONEY";
			self.TYPE_UPDATE_MAIL = "UPDATE_MAIL";
			self.TYPE_UPDATE_NOTES = "UPDATE_NOTES";
			self.TYPE_UPDATE_TITLE = "UPDATE_TITLE";
			self.TYPE_UPDATE_ADDRESS = "UPDATE_ADDRESS";
			self.TYPE_UPDATE_PHONE = "UPDATE_PHONE";
			self.TYPE_UPDATE_STATE = "UPDATE_STATE";
			self.TYPE_UPDATE_PRIORITY = "UPDATE_PRIORITY";
			
			self.TYPE_PROJ_REMOVED = "PROJ_REMOVED";
			self.TYPE_PROJ_ADDED = "PROJ_ADDED";
			
			self.TAR_TYPE_PERSON = "Person";
			self.TAR_TYPE_TASK = "Task";
			self.TAR_TYPE_PROJECT = "Project";
			self.TAR_TYPE_JOURNAL = "Journal";
			
			self.ACTIVITY_UPDATED = "ACTIVITY_UPDATED";
			
			self.summary = null;
			
			self.recentActivityGroupingFormat = {
					sameDay: "[Today]",
					nextDay: "[Tomorrow]",
					nextWeek: "dddd",
					lastDay: "[Yesterday]",
					lastWeek: "[Last] dddd",
					sameElse: "MMMM YYYY"
					};
			
		    self.getActivity = function(s, e) {
			    var deferred = $q.defer();
			    
				globalSettings.initSettings().then(						
					function() {
						//var s = moment(theDate).startOf('day').toDate().getTime();
						//var e = moment(theDate).endOf('day').toDate().getTime();
						
						var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Activity"; 
						var ref = firebase.database().ref().child(lookupKey).orderByChild("updated").startAt(s.getTime());
										
						var activity = $firebaseArray(ref);
						activity.$loaded().then( 
							function(data) {
								deferred.resolve(activity);
						});
				});
				
				return deferred.promise;
			};  
			
			self.getRecentActivity = function() {
			    var deferred = $q.defer();
			    
			    if (self.recent !== null  && !globalSettings.shouldClearCache("activitySer_RecentActivity")) {
					deferred.resolve(self.recent);
				} else {
					globalSettings.initSettings().then(						
						function() {
							var sinceDate = moment().subtract(14, 'days');
							var s = sinceDate.toDate().getTime();
							
							var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Activity"; 
							var ref = firebase.database().ref().child(lookupKey).orderByChild("updated").startAt(s);
											
							self.recent = $firebaseArray(ref);
							self.recent.$loaded().then( 
								function(data) {
									globalSettings.setCache("activitySer_RecentActivity");
									globalSettings.log("activity.service", "getRecentActivity", "Recent Activity Loaded");
									deferred.resolve(self.recent);
							});
		
					});
				}
				
				return deferred.promise;
			};
			
			self.calculateActivityGrouping = function(activity) {
				if (activity.groupingLabel == null) {
					activity.groupingLabel = $filter('amCalendar')(activity.updated, null, self.recentActivityGroupingFormat);
				}
				
				return activity.groupingLabel;			
			}
			
			self.determineRecentActivityGrouping = function(filter) {
				var deferred = $q.defer();
			
				self.getRecentActivity().then(
					function(act) {
						var i = 0;
						var tmpGrouping = [];
						
						var orderedList = $filter('orderBy')(act,'updated', true);
						var filteredList = $filter('filter')(orderedList, filter);
						var len = filteredList.length;
						
						for (i=0; i<len; i++) {
							tmpGrouping.uniquePush(self.calculateActivityGrouping(filteredList[i]));
						}
						
						deferred.resolve(tmpGrouping);
				});
				
				return deferred.promise;
			}
			
			self.getAccessActivity = function() {
			    var deferred = $q.defer();
			    
			    if (self.access !== null  && !globalSettings.shouldClearCache("activitySer_AccessActivity")) {
					deferred.resolve(self.access);
				} else {
					globalSettings.initSettings().then(						
						function() {
							if (self.access == null || globalSettings.shouldClearCache("activitySer_AccessActivity")) {
								var personKey = globalSettings.currProfile.person;
								var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/UserActivity/" + personKey; 
								var ref = firebase.database().ref().child(lookupKey).orderByChild("state").equalTo("ACTIVE");
												
								self.access = $firebaseArray(ref);
								self.access.$loaded().then( 
									function(data) {
										//self.populateTarget(self.access);
										globalSettings.setCache("activitySer_AccessActivity");
										globalSettings.log("activity.service", "getAccessActivity", "Recent Access Loaded");
										deferred.resolve(self.access);
								});
							} else {
								deferred.resolve(self.access);
							}
		
					});
				}
				
				return deferred.promise;
			};
			
			self.getActivityFor = function(type, id) {
			    var deferred = $q.defer();
			    
				globalSettings.initSettings().then(
					function() {
						var act;
						var ref;
						var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Activity"; 
						
						switch (type) {
							case self.TAR_TYPE_TASK: ref = firebase.database().ref().child(lookupKey).orderByChild("targetId").equalTo(id); break;
							case self.TAR_TYPE_PERSON: ref = firebase.database().ref().child(lookupKey).orderByChild("personId").equalTo(id); break;
							case self.TAR_TYPE_PROJECT: ref = firebase.database().ref().child(lookupKey).orderByChild("projectId").equalTo(id); break;
							default: ref = firebase.database().ref().child(lookupKey);
						}
												
						act = $firebaseArray(ref);
						act.$loaded().then( 
							function(data) {
								globalSettings.log("activity.service", "getActivityFor", "Activity Loaded");
								deferred.resolve(act);
						});
	
				});
				
				return deferred.promise;
			};
			
			//Methods
			self.registerController = function(funct) {
				return $rootScope.$on(self.TASKS_UPDATED, funct);
			};
			
			self.broadcastChange = function() {
				$rootScope.$broadcast(self.TASKS_UPDATED);  
		    };
			
			self.populateTarget = function(arr) {
				var deferred = $q.defer();
				/*var len = arr.length;
				
				for (var i=0; i<len; i++) {
					switch (arr[i].targetType) {
						case self.TAR_TYPE_PERSON: 
								self.populatePerson(arr[i]).then(
									function(activity) {
										deferred.resolve(true);
									}
								); 
								break;
						case self.TAR_TYPE_PROJECT: 
								self.populateProject(arr[i]).then(
									function(activity) {
										deferred.resolve(true);
									}
								); 
								break;
						case self.TAR_TYPE_TASK: 
								self.populateTask(arr[i]).then(
									function(activity) {*/
										deferred.resolve(true);
									/*}
								); 
								break;
					}
				}*/
				
				return deferred.promise;
			}
			
			self.determineFirstName = function(act) {
				if (act.createdName == null) {
					return "Somebody";
				} else {
					if (act.createdBy == globalSettings.currProfile.person) {
						return "You";
					} else {
						return NameParse.parse(act.createdName).firstName;
					}
				}
			}
			
			self.determineAction = function(act) {
				var result = "";
				
				switch (act.type) {
					case self.TYPE_ACCESS : result = " viewed"; break;
					
					case self.TYPE_UPDATE_DATE :
					case self.TYPE_UPDATE_MONEY :
					case self.TYPE_UPDATE_MAIL :
					case self.TYPE_UPDATE_NOTES :
					case self.TYPE_UPDATE_TITLE :
					case self.TYPE_UPDATE_ADDRESS :
					case self.TYPE_UPDATE_PHONE :
					case self.TYPE_UPDATE_STATE :
					case self.TYPE_UPDATE_PRIORITY :
					case self.TYPE_UPDATE : result = " updated"; break;
					
					case self.TYPE_CREATE : result = " created"; break;
					case self.TYPE_DELETE : result = " removed"; break;
					case self.TYPE_DONE : result = " completed"; break;
					case self.TYPE_OWNER_CHANGE : result = " assigned"; break;
					case self.TYPE_DELEGATE : result = " delegated"; break;
					case self.TYPE_REOPEN : result = " reopened"; break;
					case self.TYPE_PROJ_REMOVED : result = " removed"; break;
					case self.TYPE_PROJ_ADDED : result = " added"; break;
					
				}
				
				return result;
			}
			
			self.determineAvatar = function(act) {
				if (act.avatarType == "Custom") {
					return act.avatar;
				} else {
					if (act.avatar == null) {
						return globalSettings.pref.people.imagePath + "empty-icon.png";
					} else {
						return globalSettings.pref.people.imagePath + act.avatar;
					}
				}
			}
			
			self.determineActionContextDetails = function(act) {
				var result = "";
				
				//console.log(act.type);
				
				switch (act.targetType) {
					case self.TAR_TYPE_PERSON: result = (act.target == null) ? "" : act.target.name; break;
					case self.TAR_TYPE_PROJECT: result = act.targetTitle; break;
					case self.TAR_TYPE_JOURNAL: 
						if (act.type == self.TYPE_PROJ_REMOVED || act.type == self.TYPE_PROJ_ADDED) {
							result = act.projectTitle;
						} else {
							result = act.targetTitle;
						}
						break;
					case self.TAR_TYPE_TASK: 
						if (act.type == self.TYPE_DELEGATE) {
							result = (act.personId != undefined && act.personId != null) ? act.personName : "";
						} else if (act.type == self.TYPE_PROJ_REMOVED || act.type == self.TYPE_PROJ_ADDED) {
							result = act.projectTitle;
						} else {
							result = act.targetTitle;
						}
						break;
				}
				
				return result;
			}
			
			self.determineTarget = function(act) {
				var result = "";
				
				switch (act.targetType) {
					case self.TAR_TYPE_PERSON: result = globalSettings.currWorkspace.Terminology.clientAlias; break;
					case self.TAR_TYPE_PROJECT: result = globalSettings.currWorkspace.Terminology.projectAlias; break;
					case self.TAR_TYPE_JOURNAL: result = globalSettings.currWorkspace.Terminology.memoAlias; break;
					case self.TAR_TYPE_TASK: result = globalSettings.currWorkspace.Terminology.taskAlias; break;
				}
				
				return result;
			}
			
			self.determineActionContext = function(act) {
				var result = "";
				
				switch (act.targetType) {
					case self.TAR_TYPE_PERSON: result = globalSettings.currWorkspace.Terminology.clientAlias; break;
					case self.TAR_TYPE_PROJECT: result = globalSettings.currWorkspace.Terminology.projectAlias; break;
					case self.TAR_TYPE_JOURNAL:  
						if (act.type == self.TYPE_PROJ_REMOVED || act.type == self.TYPE_PROJ_ADDED) {
							result = globalSettings.currWorkspace.Terminology.projectAlias + ": " + act.projectTitle;
						} else {
							result = globalSettings.currWorkspace.Terminology.memoAlias;
						}
						
						break;
					case self.TAR_TYPE_TASK: 
						if (act.type == self.TYPE_DELEGATE) {
							result = (act.personId != undefined && act.personId != null) ? act.personName : "";
						} else if (act.type == self.TYPE_PROJ_REMOVED || act.type == self.TYPE_PROJ_ADDED) {
							result = globalSettings.currWorkspace.Terminology.projectAlias + ": " + act.projectTitle;
						} else {
							result = globalSettings.currWorkspace.Terminology.taskAlias;
						}
						
						break;
				}
				
				switch (act.type) {
					case self.TYPE_CREATE : 
					case self.TYPE_DONE : 
					case self.TYPE_OWNER_CHANGE :
					case self.TYPE_REOPEN : result = result + ": " + act.targetTitle; break;
					
				}
				
				return result;
			}
			
			self.determineActionTarget = function(act) {
				var result = "";
				
				switch (act.type) {
					case self.TYPE_OWNER_CHANGE : 
						if (act.personId != undefined && act.personId != null) {
							if (act.personId == globalSettings.currProfile.person) {
								result = "yourself";
							} else {
								act.personName;
							}
							result += " to ";	
						}
						break;
					case self.TYPE_DELEGATE : result = globalSettings.currWorkspace.Terminology.taskAlias.toLowerCase() + " to "; break;
					case self.TYPE_PROJ_ADDED : 
						if (act.targetType == self.TAR_TYPE_JOURNAL) {
							result = globalSettings.currWorkspace.Terminology.memoAlias + " to ";
						} else {
							result = globalSettings.currWorkspace.Terminology.taskAlias + " to ";
						}
						break;
					case self.TYPE_PROJ_REMOVED : result = globalSettings.currWorkspace.Terminology.taskAlias + " from "; break;
					
				}
				
				
				return result;
			}
			
			self.determineActionTargetDetails = function(act) {
				var result = "";
				
				switch (act.type) {
					case self.TYPE_OWNER_CHANGE : result = (act.personId != undefined && act.personId != null) ? act.personName : ""; break;
					case self.TYPE_PROJ_ADDED : 
					case self.TYPE_PROJ_REMOVED : 
					case self.TYPE_DELEGATE : result = act.targetTitle; break;
					//case self.TYPE_CREATE : result = ": " + act.targetTitle; break;
				}
				
				
				return result;
			}
			
			self.determineActionTargetFld = function(act) {
				var result = "";
				
				if (act.targetFld != null) {
					result = act.targetFld;
					
					if (act.type != self.TYPE_UPDATE_NOTES && act.targetFldOldValue != null) {
						result += " from " + act.targetFldOldValue;
					}
					
					if (act.type != self.TYPE_UPDATE_NOTES && act.targetFldValue != null) {
						result += " to " + act.targetFldValue;
					}
				}
				
				
				return result;
			}
			
			self.populateCreatedBy = function(act) {
				var deferred = $q.defer();
				
				peopleService.findPerson(act.createdById).then(
					function(person) {
						act.createdBy = person;
						deferred.resolve(act);
					}
				);
				
				return deferred.promise;
			}


			self.populatePerson = function(act) {
				var deferred = $q.defer();
				
				peopleService.findPerson(act.targetId).then(
					function(person) {
						act.target = person;
						deferred.resolve(act);
					}
				);
				
				return deferred.promise;
			}
			
			self.populateProject = function(act) {
				var deferred = $q.defer();
				
				projectService.findProject(act.targetId).then(
					function(project) {
						act.target = project;
						//projectService.determineProgress(project);
						
						if (act.personId != undefined && act.personId != null) {
							peopleService.findPerson(act.personId).then(
								function(person) {
									act.person = person;
									deferred.resolve(act);
								}
							);
						} else {
							deferred.resolve(act);
						}
					}
				);
				
				return deferred.promise;
			}
			
			self.populateTask = function(act) {
				var deferred = $q.defer();
				
				taskService.findTask(act.targetId).then(
					function(task) {
						act.target = task;
						
						if (act.personId != undefined && act.personId != null) {
							peopleService.findPerson(act.personId).then(
								function(person) {
									act.person = person;
									deferred.resolve(act);
								}
							);
						} else {
							deferred.resolve(act);
						}
					}
				);
				
				return deferred.promise;
			}
			
			self.createNewActivity = function (actType, tar, tarId, tarType, pers, proj, tarFld, tarFldValue, tarFldOldValue) {				
				var targetTitle = (tarType == "Person") ? tar.name : tar.title;
				
			    var result = {
							    type: actType,
							    targetId: tarId,
							    targetType: tarType,
							    targetTitle: targetTitle,
							    targetFld:  (tarFld == null) ? null : tarFld,
							    targetFldValue: (tarFldValue == null) ? null : tarFldValue,
							    targetFldOldValue: (tarFldOldValue == null) ? null : tarFldOldValue,
							    personId: (pers == null) ? null : pers.$id,
							    personName: (pers == null) ? null : pers.name,
							    avatar: (pers == null) ? null : pers.avatar,
							    avatarType: (pers == null) ? null : pers.avatarType,
							    projectId: (proj == null || proj == "") ? null : proj.$id,
							    projectTitle: (proj == null || proj == "") ? null : proj.title
							};
				
				globalSettings.updateTimestamp(result);
							
				return result;
			}

			self.addActivity = function (actType, tar, tarId, tarType, pers, proj, tarFld, tarFldValue, tarFldOldValue) {
			    var act = self.createNewActivity(actType, tar, tarId, tarType, pers, proj, tarFld, tarFldValue, tarFldOldValue);
				//self.pushActivity(act);
				
				var wsKey = globalSettings.currWorkspace.$id;
				var activityKey = firebase.database().ref().child("/App/Workspaces/" + wsKey + "/Activity").push().key;
				var updates = {};
				updates["/App/Workspaces/" + wsKey + "/Activity/" + activityKey] = act;
				
				firebase.database().ref().update(updates).then(
				    		function(ref) {
							  globalSettings.log("activity.service", "addActivity", "Added " + tarType + " " + actType + ": " + activityKey);
							}, 
							function(error) {
							  globalSettings.logError("activity.service", "addActivity", error);
				});
				
		    };
		    
		    self.pushActivity = function (act) {
			    self.populateCreatedBy(act);
			    
			    self.getActivity().then(
					function(activity) {
						activity.push(act);
			    		self.broadcastChange();
			    });
		    }
		    
		    self.createNewAccessActivity = function (actType, tar, tarId, tarType, pers, proj, detail1, detail2) {				
				var targetTitle = (tarType == "Person") ? tar.name : tar.title;
				
			    var result = {
							    type: actType,
							    targetId: tarId,
							    targetType: tarType,
							    targetTitle: targetTitle,
							    detail1: (detail1 == null) ? null : detail1,
							    detail2: (detail2 == null) ? null : detail2,
							    personId: (pers == null) ? null : pers.$id,
							    personName: (pers == null) ? null : pers.name,
							    avatar: (pers == null) ? null : pers.avatar,
							    avatarType: (pers == null) ? null : pers.avatarType,
							    projectId: (proj == null || proj == "") ? null : proj.$id,
							    projectTitle: (proj == null || proj == "") ? null : proj.title,
							    state: "ACTIVE"
							};
				
				switch (tarType) {
					case self.TAR_TYPE_PERSON:
						result.email = (pers == null || pers.primaryEmail == null) ? null : pers.primaryEmail;
						result.phone = (pers == null || pers.primaryPhone == null) ? null : pers.primaryPhone;
						break;
						
					case self.TAR_TYPE_PROJECT:
						result.perComp = (proj == null) ? null : proj.perComp;
						result.projectType = (proj == null || proj.typeName == null) ? null : proj.typeName;
						result.start = (proj == null) ? null : proj.start;
						result.end = (proj == null || proj.end == null) ? null : proj.end;
						result.ownerName = (proj == null || proj.ownerName == null) ? null : proj.ownerName;
						break;
					case self.TAR_TYPE_JOURNAL:
						result.entryType = (tar == null) ? null : tar.type;
						result.entryUpdated = (tar == null) ? null : tar.updated;
						break;
				}
				
				
				globalSettings.updateTimestamp(result);
							
				return result;
			}
		    
		    //actType, tar, tarId, tarType, pers, proj, tarFld, tarFldValue, tarFldOldValue

		    self.addAccessActivity = function (actType, tar, tarId, tarType, pers, proj, detail1, detail2) {
			    self.archiveAccessActivity(tarId).then(
				    function(result) {
					    var act = self.createNewAccessActivity(actType, tar, tarId, tarType, pers, proj, detail1, detail2);
				
						var wsKey = globalSettings.currWorkspace.$id;
						var personKey = globalSettings.currProfile.person;
						var activityKey = firebase.database().ref().child("/App/Workspaces/" + wsKey + "/UserActivity/" + personKey).push().key;
						
						var updates = {};
						updates["/App/Workspaces/" + wsKey + "/UserActivity/" + personKey + "/" + activityKey] = act;
						
						firebase.database().ref().update(updates).then(
					    	function(ref) {
								globalSettings.log("activity.service", "addAccessActivity", "Added " + tarType + " " + actType + ": " + activityKey);
							}, 
							function(error) {
								globalSettings.logError("activity.service", "addAccessActivity", error);
						});
				});
			};
			
			self.archiveAccessActivity = function(tarId) {
				var deferred = $q.defer();
				
				self.getAccessActivity().then(
					function(activities) {
						var len = activities.length;
						var act;
						var i;
						var found = [];
						
						for (i=0; i<len; i++) {
							act = activities[i];
							
							if (act.targetId == tarId && act.state != "ARCHIVE") {
								found.push(act);
							}
						}
						
						len = found.length;
						if (len > 0) {
							for (i=0; i<len; i++) {
								act = found[i];
								act.state = "ARCHIVE";
								
								activities.$save(act).then(
						    		function(ref) {
									  globalSettings.log("activity.service", "archiveAccessActivity", "Archived activity: " +  ref.key);
									  deferred.resolve(true);
									}, 
									function(error) {
									  globalSettings.logError("activity.service", "archiveAccessActivity", error);
									  deferred.resolve(true);
								});
							}
						} else {
							globalSettings.log("activity.service", "archiveAccessActivity", "No activity found for: " +  tarId);
							deferred.resolve(true);
						}
					}
				);
				
				return deferred.promise;
			}
		    
		    self.openActionContext = function(activity) {
				switch (activity.targetType) {
					case self.TAR_TYPE_PERSON: globalNav.openPeopleDetails(activity.targetId); break;
					case self.TAR_TYPE_TASK: globalNav.openTaskDetails(activity.targetId); break;
					case self.TAR_TYPE_PROJECT: globalNav.openProjectDetails(activity.targetId); break;					
				}
		    }
		    
		    self.getSummary = function() {
			    var deferred = $q.defer();
			    
				if (self.summary !== null) {
					deferred.resolve(self.summary);
				} else {
					var userid = globalSettings.currProfile.person;
					var wsKey = globalSettings.currWorkspace.$id;
				    var lookupKey = "App/Workspaces/" + wsKey + "/Summary/" + userid;
					var ref = firebase.database().ref().child(lookupKey);
					
					self.summary = $firebaseObject(ref);
					self.summary.$loaded().then(
						function(data) {
							deferred.resolve(self.summary);
						}
					)
				}
				
				return deferred.promise;

		    }
		    		    
		}
		
		return new ActivityService();
	}]);

}());