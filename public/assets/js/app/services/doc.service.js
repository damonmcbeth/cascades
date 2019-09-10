(function() {
    'use strict';

    var app = angular.module('app');
    
    
    app.factory('docService', ['$http', '$q', '$filter', 'globalSettings', '$firebaseArray', 
    
    function($http, $q, $filter, globalSettings, $firebaseArray) {
		
		function DocService() {
			var self = this;
			
			self.allFolders = [];
			self.allFiles = [];
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
										globalSettings.setCache("docSer_Folders");
										deferred.resolve(self.allFolders);
								});
							} else {
								deferred.resolve(self.allFolders);
							}

						});
				}
				
				return deferred.promise;
			};

			self.getAllFiles = function() {
			    var deferred = $q.defer();
			    
				if (!globalSettings.shouldClearCache("docSer_Files")) {
					deferred.resolve(self.allFiles);
				} else {
					globalSettings.initSettings().then(
						function() {
							if (globalSettings.shouldClearCache("docSer_Files")) {
								var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Docs/Files"; 
								var ref = firebase.database().ref().child(lookupKey);
								
								self.allFiles = $firebaseArray(ref);
								self.allFiles.$loaded().then( 
									function(data) {
										globalSettings.log("doc.service", "getAllFiles", "Files Loaded");
										globalSettings.setCache("docSer_Files");
										deferred.resolve(self.allFiles);
								});
							} else {
								deferred.resolve(self.allFiles);
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

			self.newFile = function() {
				var result = {
					title: '',
					url: '',
					folder: '',
					size: 0,
					type: ''
				};
				
				return result;
			};
			
			self.cloneFile = function (src, dest) {
			    var deferred = $q.defer();
			    
			    if (src == null) {
				    deferred.resolve(null);
			    } else {
				    var result = (dest == null) ? self.newFile() : dest;
					
					result.$id = src.$id;
					result.title = src.title;
					result.folder = src.folder;
					result.url = src.url;
					result.size = src.size;
					result.type = src.type;
		            
		            result.created = src.created;
		            result.createdName = src.createdName;
		            result.updated = src.updated;
		            result.updatedName = src.updatedName;
		            
		            self.initFile(result).then(
			            function(fld) {
				            deferred.resolve(fld);
			        });
	            }
	            
	            return deferred.promise;
			};
			
			self.initFile = function(file) {
			    var deferred = $q.defer();
			    
			    deferred.resolve(file);
			    
		        return deferred.promise;
	        }

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

			self.findFile = function(eid) {			
				var deferred = $q.defer();
			    
			    self.getAllFiles().then(
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
								  globalSettings.log("doc.service", "saveFolder", "Added Entry: " +  ref.key);
								  edited.$id = ref.key;
								  deferred.resolve(orig);
								  
								}, 
								function(error) {
								  globalSettings.logError("doc.service", "saveFolder:Create", error);
								  deferred.resolve(orig);
							});
						} else {
							var entry = self.updateOrigFolderForSave(edited, entries);
					    	entries.$save(entry).then(
					    		function(ref) {
								  globalSettings.log("doc.service", "saveFolder", "Updated Entry: " +  ref.key);
								  deferred.resolve(orig);
								}, 
								function(error) {
								  globalSettings.logError("doc.service", "saveFolder:Update", error);
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

			self.saveFile = function (edited, orig) {
			    var deferred = $q.defer();
			    
			    self.getAllFiles().then(
					function(entries) {
						if (orig == null) {
							entries.$add(self.createFileForSave(edited)).then(
								function(ref) {
								  globalSettings.log("doc.service", "saveFile", "Added Entry: " +  ref.key);
								  edited.$id = ref.key;
								  deferred.resolve(orig);
								  
								}, 
								function(error) {
								  globalSettings.logError("doc.service", "saveFile:Create", error);
								  deferred.resolve(orig);
							});
						} else {
							var entry = self.updateOrigFileForSave(edited, entries);
					    	entries.$save(entry).then(
					    		function(ref) {
								  globalSettings.log("doc.service", "saveFile", "Updated Entry: " +  ref.key);
								  deferred.resolve(orig);
								}, 
								function(error) {
								  globalSettings.logError("doc.service", "saveFile:Update", error);
								  deferred.resolve(orig);
							});
					    }
					}
				);
				
				return deferred.promise;
		    };
		    
		    self.createFileForSave = function(src) {
			    var result = {
								title: src.title,
								url: src.url,
								folder: src.folder,
								size: src.size,
								type: src.type
							};
							
				globalSettings.updateTimestamp(result);			
	            
	            return result;
		    }
		    
		    self.updateOrigFileForSave = function(src, entries) {
			    var result = entries.$getRecord(src.$id);
			    	            
				result.title = src.title;
				result.url = src.url;
				result.folder = src.folder;
				result.size = src.size;
				result.type = src.type;
	            
	            globalSettings.updateTimestamp(result);
	            
	            return result;
			}
			
			self.deleteFile = function (src) {
			    var deferred = $q.defer();
				
				self.getAllFiles().then(
					function(files) {
						var file = folders.$getRecord(src.$id);
						folders.$remove(file);
						
						deferred.resolve(true);
					}
				);
				
				return deferred.promise;
		    };
			

		}
		
		return new DocService();
	}]);

}());