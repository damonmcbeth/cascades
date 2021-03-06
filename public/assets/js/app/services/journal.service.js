﻿(function() {
    'use strict';

    var app = angular.module('app');
    
    
    app.factory('journalService', ['$http', '$q', '$filter', 'globalSettings', 'tagService', 'peopleService', 'projectService', 'messageService', 'insightsService', '$firebaseArray', 
    
    function($http, $q, $filter, globalSettings, tagService, peopleService, projectService, messageService, insightsService, $firebaseArray) {
		
		function JournalService() {
			var self = this;
			
			self.allEntries = [];
			self.sinceGrouping = [];
			
			self.cached = false;
			
		    self.getAllEntries = function() {
			    var deferred = $q.defer();
			    
				if (self.cached && !globalSettings.shouldClearCache("journalSer_Entries")) {
					deferred.resolve(self.allEntries);
				} else {

					globalSettings.initSettings().then(
						function() {
							if (!self.cached || globalSettings.shouldClearCache("journalSer_Entries")) {
								var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Journal"; 
								var ref = firebase.database().ref().child(lookupKey);
								
								self.allEntries = $firebaseArray(ref);
								self.allEntries.$loaded().then( 
									function(data) {
										globalSettings.log("journal.service", "getAllEntries", "Journal Loaded");
										
										self.cached = true;
										globalSettings.setCache("journalSer_Entries");
										self.buildSinceGrouping();
										
										self.allEntries.$watch(function(event) {
											console.log(event);
											if (event.event == "child_added" || event.event == "child_changed") {
												self.buildSinceGrouping();
											}
										});
										
										deferred.resolve(self.allEntries);
								});
							} else {
								deferred.resolve(self.allEntries);
							}

						});

				}
				
				return deferred.promise;
			};
			
			self.sinceFormat = {
					sameDay: "[Today]",
					nextDay: "[Tomorrow]",
					nextWeek: "dddd",
					lastDay: "[Yesterday]",
					lastWeek: "[Last] dddd",
					sameElse: "MMMM YYYY"
					};
			
			self.calculateSince = function(item) {
				//if (item.since == null) {
					item.since = $filter('amCalendar')(item.updated, null, self.sinceFormat);
				//}
				
				return item.since;			
			}
			
			self.buildSinceGrouping = function() {
				var deferred = $q.defer();
				
				self.getAllEntries().then(
					function(entries) {
						var i = 0;
						var tmpGrouping = [];
						tmpGrouping.uniquePush("Today");
						
						var orderedList = $filter('orderBy')(entries, 'updated', true);
						var len = orderedList.length;
						
						for (i=0; i<len; i++) {
							tmpGrouping.uniquePush(self.calculateSince(orderedList[i]));
						}
						
						self.sinceGrouping = tmpGrouping;
						deferred.resolve(self.sinceGrouping);		
				});
				
				return deferred.promise;
			}
			
			
			self.newEntry = function() {
				var result = {
		            title: '',
					type: 'Memo',
					url: null,
		            content: '',
		            status: 'Unread',
		            duration: 0,
					start: null,
					end: null,
		            archived: false,
		            tags: [],
		            attachments: [],
					people: [],
					comments: []
				};
				
				return result;
			};
			
			self.cloneEntry = function (src, dest) {
			    var deferred = $q.defer();
			    
			    if (src == null) {
				    deferred.resolve(null);
			    } else {
				    var result = (dest == null) ? self.newEntry() : dest;
					
					result.$id = src.$id;
		            result.title = src.title;
					result.type = src.type;
					result.url = src.url;
		            result.content = src.content;
					result.status = src.status;
	            	result.duration = src.duration;
	            	result.targetId = src.targetId == undefined ? null : src.targetId;
					result.target = src.target;
					result.targetName = src.targetName;
					result.start = src.start == undefined ? null :  moment(src.start).toDate(); //new Date(src.start);
					result.end = src.end == undefined ? null : new Date(src.end);
					result.archived = src.archived;
					result.projectId = src.projectId == undefined ? null : src.projectId;
					
					result.people = [];
					result.comments = [];
					
		            result.created = src.created;
		            result.createdName = src.createdName;
		            result.updated = src.updated;
		            result.updatedName = src.updatedName;
		            
					self.cloneAttachments(src, result);
					self.cloneComments(src, result);
		            
		            self.initEntry(result).then(
			            function(proj) {
				            deferred.resolve(proj);
			        });
	            }
	            
	            return deferred.promise;
		    };
			
			self.cloneComments = function (src, dest) {
			    var len = src.comments == null ? 0 : src.comments.length;
			    var tmp;
			    var result = [];
			    
			    for (var i=0; i<len; i++) {
				    tmp = {
					    created: src.comments[i].created == undefined ? null : new Date(src.comments[i].created),		    			
		    			title: src.comments[i].title,
						createdName: src.comments[i].createdName,
						createdBy: src.comments[i].createdBy
				    }
				    result.push(tmp);
			    }
			    
			    dest.comments = result;
			    
		    }

		    self.cloneAttachments = function (src, dest) {
			    var len = src.attachments == null ? 0 : src.attachments.length;
			    var tmp;
			    var result = [];
			    
			    for (var i=0; i<len; i++) {
				    tmp = {
					    type: src.attachments[i].type,		    			
		    			title: src.attachments[i].title,
						url: src.attachments[i].url,
						source: src.attachments[i].source == null ? null : src.attachments[i].source
				    }
				    result.push(tmp);
			    }
			    
			    dest.attachments = result;
			    
		    }

			
			self.initEntry = function(entry) {
			    var deferred = $q.defer();
			    
			    peopleService.findPerson(entry.targetId).then(
					function(target) {
						entry.target = target;
						
						projectService.findProject(entry.projectId).then(
							function(project) {
								entry.project = project;
								deferred.resolve(entry);

						});	
				});
			    
		        return deferred.promise;
	        }
			
			self.findEntry = function(eid) {			
				var deferred = $q.defer();
			    
			    self.getAllEntries().then(
					function(entries) {
						deferred.resolve(self.lookupEntry(eid, entries));				
					},
					function(result) {
						console.log("Failed to find the entry, result is " + result); 
						deferred.resolve(null);
      				}
				);
				
				return deferred.promise;
			};
			
			self.lookupEntry = function(entryId, entries) {
				var result = entries.$getRecord(entryId);
				
				return result;
			}
			
			self.saveEntry = function (edited, orig) {
			    var deferred = $q.defer();
				var origTargetId = (orig == null) ? null : orig.targetId;
				
			    self.getAllEntries().then(
					function(entries) {
						if (orig == null) {
							entries.$add(self.createEntryForSave(edited)).then(
								function(ref) {
								  globalSettings.log("journal.service", "saveEntry", "Added Entry: " +  ref.key);
								  edited.$id = ref.key;
								  tagService.saveTagsForItem(ref.key, tagService.TYPE_JOURNAL, edited.tags);
								  peopleService.savePeopleForItem(ref.key, peopleService.TYPE_JOURNAL, edited.people);

								  self.notifyTarget(edited);
								  self.determineHighlightEntries();
								  deferred.resolve(orig);
								  
								}, 
								function(error) {
								  globalSettings.logError("journal.service", "saveEntry:Create", error);
								  deferred.resolve(orig);
							});
						} else {
							var entry = self.updateOrigEntryForSave(edited, entries);
							
					    	entries.$save(entry).then(
					    		function(ref) {
								  globalSettings.log("journal.service", "saveEntry", "Updated Entry: " +  ref.key);
								  tagService.saveTagsForItem(ref.key, tagService.TYPE_JOURNAL, edited.tags);
								  peopleService.savePeopleForItem(ref.key, peopleService.TYPE_JOURNAL, edited.people);
								  
								  self.calculateSince(entry);
								  self.calculateSummary(origTargetId, edited);
								  self.notifyTarget(edited, origTargetId);
								  self.determineHighlightEntries();
								  deferred.resolve(orig);
								}, 
								function(error) {
								  globalSettings.logError("journal.service", "saveEntry:Update", error);
								  deferred.resolve(orig);
							});
					    }
					}
				);
				
				return deferred.promise;
		    };
			
			self.notifyTarget = function(edited, origTargetId) {
			    if (edited.targetId != null && (origTargetId == null || edited.targetId != origTargetId)) {
					if (edited.target.notificationToken != null) {
						var msg = edited.updatedName + " sent you a message: " + edited.title;
						var icon = globalSettings.currProfile.avatar;
						var iconType = globalSettings.currProfile.avatarType;

						if (iconType != "Custom") {
							var imgPath = globalSettings.pref.people.imagePath;
							icon = imgPath + icon;
						}

						messageService.sendMessage(edited.target.notificationToken, msg, icon);
					}
			    }
		    }

		    self.calculateSummary = function(origTargetId, edited) {
			    /*if (edited.targetId != null) {			    
			    	insightsService.calculateUserJournalSummary(edited.targetId);
			    }
			    
			    if (edited.targetId != origTargetId && origTargetId != null) {
				    insightsService.calculateUserJournalSummary(origTargetId);
			    }*/
		    }
		    
		    self.createEntryForSave = function(src) {
			    var result = {
					            title: src.title,
								type: src.type == null ? "Memo" : src.type,
								url: src.url == null ? null : src.url,
					            content: src.content == null ? null : src.content,
								status: src.status,
				            	duration: src.duration == null ? 0 : src.duration,
				            	targetId: src.targetId == null ? null : src.targetId,
								targetName: src.targetId == null ? null : src.target.name,
								archived: src.archived == null ? false : src.archived,
								start: src.start == null ? null : src.start.getTime(),
								end: src.end == null ? null : src.end.getTime(),
								projectId: src.projectId,
								projectName: src.project == null ? null : src.project.title,
								attachments: src.attachments,
								comments: src.comments
							};
							
				self.prepCommentsForSave(result.comments);
				globalSettings.updateTimestamp(result);			
	            
	            return result;
			}
			
			self.prepCommentsForSave = function(comments) {
				var len = comments == null ? 0 : comments.length;
			    var tmp;
			    
			    for (var i=0; i<len; i++) {
					tmp = comments[i].created;
					tmp = tmp == null ? new Date() : tmp;
					comments[i].created = tmp.getTime();				    
			    }
			}
		    
		    self.updateOrigEntryForSave = function(src, entries) {
			    var result = entries.$getRecord(src.$id);
			    
			    result.title = src.title;
				result.type = src.type == null ? "Memo" : src.type;
				result.url = src.url == null ? null : src.url;
	            result.content = src.content == null ? null : src.content;
				result.status = src.status;
            	result.duration = src.duration == null ? 0 : src.duration;
            	result.targetId = src.targetId == null ? null : src.targetId;
				result.targetName = src.targetId == null ? null : src.target.name;
				result.since = null;
				result.start = src.start == null ? null : src.start.getTime();
				result.end = src.end == null ? null : src.end.getTime();
				result.archived = src.archived == null ? false : src.archived;
				result.projectId = src.projectId;
	            result.projectName = (src.project == "" || src.project == null) ? null : src.project.title;
    			result.attachments = src.attachments;
	            result.hasHighlightTag = null;
	            result.tags = null;
				result.people = null;
				result.comments = src.comments;
	            
				globalSettings.updateTimestamp(result);
				self.prepCommentsForSave(result.comments);
				self.clearReadFlags(result);
	            
	            return result;
			}
			
			self.getProperties = function(obj){
				var keys = [];
				for(var key in obj){
				   keys.push(key);
				}
				return keys;
			 }

			self.clearReadFlags = function(entry) {
				var readFlag = "READ_" + globalSettings.currProfile.person;
				var props = self.getProperties(entry)
				var prop;

				var len = props.length;
				for (var i=0; i<len; i++) {
					prop = props[i];
					if (prop.startsWith("READ_") && readFlag != entry[prop]) {
						entry[prop] = null;
					}
				}
			}

			self.archiveEntry = function(entryId) {
				var deferred = $q.defer();
			    
			    self.getAllEntries().then(
					function(entries) {
						var entry = self.lookupEntry(entryId, entries);
						
						if (entry != null) {
							entry.archived = true;
							entry.since = null;
							globalSettings.updateTimestamp(entry);
							
							entries.$save(entry).then(
								function(result) {
									
									deferred.resolve(true);
							})
						}
					}
				);
				
				return deferred.promise;
					
			}
			
			self.restoreEntry = function(entryId) {
				var deferred = $q.defer();
			    
			    self.getAllEntries().then(
					function(entries) {
						var entry = self.lookupEntry(entryId, entries);
						
						if (entry != null) {
							entry.archived = false;
							entry.since = null;
							globalSettings.updateTimestamp(entry);
							
							entries.$save(entry).then(
								function(result) {
									
									deferred.resolve(true);
							})
						}
					}
				);
				
				return deferred.promise;
					
			}
			
			self.markAsRead = function(entryId) {
				var deferred = $q.defer();
			    
			    self.getAllEntries().then(
					function(entries) {
						var entry = self.lookupEntry(entryId, entries);
						var person = globalSettings.currProfile.person;
						var readFlag = "READ_" + globalSettings.currProfile.person;
						
						if (entry != null && entry[readFlag] != "Y") {
							entry[readFlag] = "Y";
							entry.markRead = globalSettings.currProfile.person;
							entry.updatedByUser = globalSettings.authUser.uid;

							entries.$save(entry).then(
								function(result) {
									deferred.resolve(true);
							})
							
							//insightsService.calculateUserJournalSummary(entry.targetId);

						}
					}
				);
				
				return deferred.promise;
					
			}		
			
			self.determineHighlightEntries = function() {
				var found = false;
				
				tagService.getAllTags().then(
					function(tags) {
						var tag;
						var srcTag;
						
						self.getAllEntries().then(					
							function(entries) {
								var len = entries.length;
								var entry;
								
								for (var i=0; i<len; i++) {
									entry = entries[i];
									found = false;
									
									if (entry.tags != undefined) {
										angular.forEach(entry.tags, function(value, key) {
											srcTag = tagService.lookupTags(key, tags);
											if (srcTag != null && srcTag.isHighlighted) {
												found = true;
												return;
											}
										});
									}
									
									entry.hasHighlightTag = found;
								}
						});
				})
			};

		}
		
		return new JournalService();
	}]);

}());