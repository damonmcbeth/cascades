(function() {
    'use strict';

    var app = angular.module('app');
    
    
    app.factory('journalService', ['$http', '$q', '$filter', 'globalSettings', 'tagService', 'peopleService', 'projectService', 'insightsService', '$firebaseArray', 
    
    function($http, $q, $filter, globalSettings, tagService, peopleService, projectService, insightsService, $firebaseArray) {
		
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
				if (item.since == null) {
					item.since = $filter('amCalendar')(item.updated, null, self.sinceFormat);
				}
				
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
		            content: '',
		            status: 'Unread',
		            duration: 0,
		            start: null,
		            archived: false,
		            tags: [],
		            attachments: [],
		            people: []
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
		            result.content = src.content;
					result.status = src.status;
	            	result.duration = src.duration;
	            	result.targetId = src.targetId == undefined ? null : src.targetId;
					result.target = src.target;
					result.targetName = src.targetName;
					result.start = src.start == undefined ? null : new Date(src.start);
					result.archived = src.archived;
					result.projectId = src.projectId == undefined ? null : src.projectId;
					
					result.people = [];
					
		            result.created = src.created;
		            result.createdName = src.createdName;
		            result.updated = src.updated;
		            result.updatedName = src.updatedName;
		            
		            self.cloneAttachments(src, result);
		            
		            self.initEntry(result).then(
			            function(proj) {
				            deferred.resolve(proj);
			        });
	            }
	            
	            return deferred.promise;
		    };
		    
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
			    
			    self.getAllEntries().then(
					function(entries) {
						if (orig == null) {
							entries.$add(self.createEntryForSave(edited)).then(
								function(ref) {
								  globalSettings.log("journal.service", "saveEntry", "Added Entry: " +  ref.key);
								  edited.$id = ref.key;
								  tagService.saveTagsForItem(ref.key, tagService.TYPE_JOURNAL, edited.tags);
								  peopleService.savePeopleForItem(ref.key, peopleService.TYPE_JOURNAL, edited.people);

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
								  self.calculateSummary(orig, edited);
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
		    
		    self.calculateSummary = function(orig, edited) {
			    if (edited.targetId != null) {			    
			    	insightsService.calculateUserJournalSummary(edited.targetId);
			    }
			    
			    if (edited.targetId != orig.targetId && orig.targetId != null) {
				    insightsService.calculateUserJournalSummary(orig.targetId);
			    }
		    }
		    
		    self.createEntryForSave = function(src) {
			    var result = {
					            title: src.title,
					            type: src.type == null ? "Memo" : src.type,
					            content: src.content == null ? null : src.content,
								status: src.status,
				            	duration: src.duration == null ? 0 : src.duration,
				            	targetId: src.targetId == null ? null : src.targetId,
								targetName: src.targetId == null ? null : src.target.name,
								archived: src.archived == null ? false : src.archived,
								start: src.start == null ? null : src.start.getTime(),
								projectId: src.projectId,
								projectName: src.project == null ? null : src.project.title,
				    			attachments: src.attachments
							};
							
				globalSettings.updateTimestamp(result);			
	            
	            return result;
		    }
		    
		    self.updateOrigEntryForSave = function(src, entries) {
			    var result = entries.$getRecord(src.$id);
			    
			    result.title = src.title;
			    result.type = src.type == null ? "Memo" : src.type;
	            result.content = src.content == null ? null : src.content;
				result.status = src.status;
            	result.duration = src.duration == null ? 0 : src.duration;
            	result.targetId = src.targetId == null ? null : src.targetId;
				result.targetName = src.targetId == null ? null : src.target.name;
				result.since = null;
				result.start = src.start == null ? null : src.start.getTime();
				result.archived = src.archived == null ? false : src.archived;
				result.projectId = src.projectId;
	            result.projectName = (src.project == "" || src.project == null) ? null : src.project.title;
    			result.attachments = src.attachments;
	            result.hasHighlightTag = null;
	            result.tags = null;
	            result.people = null;
	            
	            globalSettings.updateTimestamp(result);
	            
	            return result;
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
						
						if (entry != null && entry.status != "Read" && person == entry.targetId) {
							entry.status = "Read";
							globalSettings.updateTimestamp(entry);
							
							entries.$save(entry).then(
								function(result) {
									deferred.resolve(true);
							})
							
							insightsService.calculateUserJournalSummary(entry.targetId);

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