(function() {
    'use strict';

    var app = angular.module('app');
    
    
    app.factory('docService', ['$http', '$q', '$filter', 'globalSettings', '$firebaseArray', 
    
    function($http, $q, $filter, globalSettings, $firebaseArray) {
		
		function DocService() {
			var self = this;
			
			self.allFolders = [];
			self.allEntries = [];
			
		    self.getAllFolders = function() {
			    var deferred = $q.defer();
			    
				if (!globalSettings.shouldClearCache("docSer_Folders")) {
					deferred.resolve(self.allFolders);
				} else {
					globalSettings.initSettings().then(
						function() {
							if (globalSettings.shouldClearCache("docSer_Folders")) {
								var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Docs/Folders"; 
								var ref = firebase.database().ref().child(lookupKey);
								
								self.allFolders = $firebaseArray(ref);
								self.allFolders.$loaded().then( 
									function(data) {
										globalSettings.log("doc.service", "getAllFolders", "Folders Loaded");
										globalSettings.setCache("reminderSer_Folders");
										deferred.resolve(self.allFolders);
								});
							} else {
								deferred.resolve(self.allFolders);
							}

						});
				}
				
				return deferred.promise;
			};
			
			self.newFolder = function() {
				var result = {
		            title: ''
				};
				
				return result;
			};
			
			self.cloneFolder = function (src, dest) {
			    var deferred = $q.defer();
			    
			    if (src == null) {
				    deferred.resolve(null);
			    } else {
				    var result = (dest == null) ? self.newFolder() : dest;
					
					result.$id = src.$id;
		            result.title = src.title;
		            
		            result.created = src.created;
		            result.createdName = src.createdName;
		            result.updated = src.updated;
		            result.updatedName = src.updatedName;
		            
		            self.initFolder(result).then(
			            function(fld) {
				            deferred.resolve(fld);
			        });
	            }
	            
	            return deferred.promise;
		    };
		    
		    
			self.initFolder = function(folder) {
			    var deferred = $q.defer();
			    
			    deferred.resolve(folder);
			    
		        return deferred.promise;
	        }
			
			self.findFolder = function(eid) {			
				var deferred = $q.defer();
			    
			    self.getAllFolders().then(
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
			
			self.saveFolder = function (edited, orig) {
			    var deferred = $q.defer();
			    
			    self.getAllFolders().then(
					function(entries) {
						if (orig == null) {
							entries.$add(self.createFolderForSave(edited)).then(
								function(ref) {
								  globalSettings.log("reminder.service", "saveFolder", "Added Entry: " +  ref.key);
								  edited.$id = ref.key;
								  deferred.resolve(orig);
								  
								}, 
								function(error) {
								  globalSettings.logError("reminder.service", "saveFolder:Create", error);
								  deferred.resolve(orig);
							});
						} else {
							var entry = self.updateOrigFolderForSave(edited, entries);
					    	entries.$save(entry).then(
					    		function(ref) {
								  globalSettings.log("reminder.service", "saveFolder", "Updated Entry: " +  ref.key);
								  deferred.resolve(orig);
								}, 
								function(error) {
								  globalSettings.logError("reminder.service", "saveFolder:Update", error);
								  deferred.resolve(orig);
							});
					    }
					}
				);
				
				return deferred.promise;
		    };
		    
		    self.createFolderForSave = function(src) {
			    var result = {
					            title: src.title
							};
							
				globalSettings.updateTimestamp(result);			
	            
	            return result;
		    }
		    
		    self.updateOrigFolderForSave = function(src, entries) {
			    var result = entries.$getRecord(src.$id);
			    	            
	            result.title = src.title;
	            
	            globalSettings.updateTimestamp(result);
	            
	            return result;
			}
			
			self.deleteFolder = function (src) {
			    var deferred = $q.defer();
				
				self.getAllFolders().then(
					function(folders) {
						var folder = folders.$getRecord(src.$id);
						folders.$remove(folder);
						
						deferred.resolve(true);
					}
				);
				
				return deferred.promise;
		    };
		}
		
		return new DocService();
	}]);

}());