(function() {
    'use strict';

    var app = angular.module('app');
    
    
    app.factory('reminderService', ['$http', '$q', '$filter', 'globalSettings', 'tagService', 'peopleService', '$firebaseArray', 
    
    function($http, $q, $filter, globalSettings, tagService, peopleService, $firebaseArray) {
		
		function ReminderService() {
			var self = this;
			
			self.allEntries = [];
			self.currEntries = [];
			
		    self.getAllEntries = function() {
			    var deferred = $q.defer();
			    
				if (!globalSettings.shouldClearCache("reminderSer_Entries")) {
					deferred.resolve(self.allEntries);
				} else {
					globalSettings.initSettings().then(
						function() {
							

							if (globalSettings.shouldClearCache("reminderSer_Entries")) {
								var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Reminder"; 
								var ref = firebase.database().ref().child(lookupKey);
								
								self.allEntries = $firebaseArray(ref);
								self.allEntries.$loaded().then( 
									function(data) {
										globalSettings.log("reminder.service", "getAllEntries", "Reminder Loaded");
										globalSettings.setCache("reminderSer_Entries");
										deferred.resolve(self.allEntries);
								});
							} else {
								deferred.resolve(self.allEntries);
							}

						});
				}
				
				return deferred.promise;
			};
			
			self.getCurrentEntries = function() {
			    var deferred = $q.defer();
			    
				if (!globalSettings.shouldClearCache("reminderSer_CurrEntries")) {
					deferred.resolve(self.currEntries);
				} else {
					globalSettings.initSettings().then(
						function() {
							if (globalSettings.shouldClearCache("reminderSer_CurrEntries")) {
								var today = moment().startOf('day').toDate().getTime();
								//var tomorrow = moment().add(1, 'days').endOf('day').toDate().getTime();
								
								var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Reminder";
								var ref = firebase.database().ref().child(lookupKey).orderByChild("end").startAt(today);
								
								self.currEntries = $firebaseArray(ref);
								self.currEntries.$loaded().then( 
									function(data) {
										globalSettings.log("reminder.service", "getCurrentEntries", "Current Reminders Loaded");
										globalSettings.setCache("reminderSer_CurrEntries");
										deferred.resolve(self.currEntries);
								});
							} else {
								deferred.resolve(self.currEntries);
							}

						});
				}
				
				return deferred.promise;
			};
			
			self.newEntry = function() {
				var dt = moment().startOf('hour').toDate();

				var result = {
		            title: '',
		            allday: true,		          
		            start: dt,
					end: dt,
					startTime: dt,
		            endTime: dt,
		            repeat: false,
		            everyCount: 1,
		            everyInterval: "weeks", 
		            until: moment().add(1, 'months').toDate(),
		            archived: false,
		            notes: null
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
		            result.allday = src.allday;
					result.start = src.start == undefined ? null : new Date(src.start);
					result.end = src.end == undefined ? null : new Date(src.end);
					result.startTime = src.start == undefined ? null : new Date(src.startTime);
					result.endTime = src.end == undefined ? null : new Date(src.endTime);
					result.until = src.until == undefined ? null : new Date(src.until);
					
					result.repeat = src.repeat;
					result.everyCount = src.everyCount == undefined ? 0 : src.everyCount;
					result.everyInterval = src.everyInterval == undefined ? null : src.everyInterval;
					result.archived = src.archived;
					result.notes = src.notes == undefined ? null : src.notes;
					
		            result.created = src.created;
		            result.createdName = src.createdName;
		            result.updated = src.updated;
		            result.updatedName = src.updatedName;
		            
		            self.initEntry(result).then(
			            function(proj) {
				            deferred.resolve(proj);
			        });
	            }
	            
	            return deferred.promise;
		    };
		    
		    
			self.initEntry = function(entry) {
			    var deferred = $q.defer();
			    
			    //peopleService.findPerson(entry.targetId).then(
				//	function(target) {
				//		entry.target = target;
						deferred.resolve(entry);
				//});
			    
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
								  globalSettings.log("reminder.service", "saveEntry", "Added Entry: " +  ref.key);
								  edited.$id = ref.key;
								  deferred.resolve(orig);
								  
								}, 
								function(error) {
								  globalSettings.logError("reminder.service", "saveEntry:Create", error);
								  deferred.resolve(orig);
							});
						} else {
							var entry = self.updateOrigEntryForSave(edited, entries);
					    	entries.$save(entry).then(
					    		function(ref) {
								  globalSettings.log("reminder.service", "saveEntry", "Updated Entry: " +  ref.key);
								  deferred.resolve(orig);
								}, 
								function(error) {
								  globalSettings.logError("reminder.service", "saveEntry:Update", error);
								  deferred.resolve(orig);
							});
					    }
					}
				);
				
				return deferred.promise;
		    };
		    
		    self.createEntryForSave = function(src) {
			    var result = {
					            title: src.title,
					            allday: src.allday,
								start: src.start == undefined ? null : src.start.getTime(),
								end: src.end == undefined ? null : src.end.getTime(),
								startTime: src.startTime == undefined ? null : src.startTime.getTime(),
								endTime: src.endTime == undefined ? null : src.endTime.getTime(),
								until: src.until == undefined ? null : src.until.getTime(),
								repeat: src.repeat,
								everyCount: src.everyCount == undefined ? 0 : src.everyCount,
								everyInterval: src.everyInterval == undefined ? null : src.everyInterval,
								archived: src.archived,
								notes: src.notes == undefined ? null : src.notes
							};
							
				globalSettings.updateTimestamp(result);			
	            
	            return result;
		    }
		    
		    self.updateOrigEntryForSave = function(src, entries) {
			    var result = entries.$getRecord(src.$id);
			    	            
	            result.title = src.title;
	            result.allday = src.allday;
				result.start = src.start == undefined ? null : src.start.getTime();
				result.end = src.end == undefined ? null : src.end.getTime();
				result.startTime = src.startTime == undefined ? null : src.startTime.getTime();
				result.endTime = src.endTime == undefined ? null : src.endTime.getTime();
				result.until = src.until == undefined ? null : src.until.getTime();
				result.repeat = src.repeat;
				result.everyCount = src.everyCount == undefined ? 0 : src.everyCount;
				result.everyInterval = src.everyInterval == undefined ? null : src.everyInterval;
				result.archived = src.archived;
	            result.notes = src.notes == undefined ? null : src.notes;
	            
	            globalSettings.updateTimestamp(result);
	            
	            return result;
		    }			
		}
		
		return new ReminderService();
	}]);

}());