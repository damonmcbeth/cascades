 (function() {
    'use strict';

    var app = angular.module('app');
    
    		
	app.factory('tagService', ['$http', '$q', '$filter', 'globalSettings', '$firebaseArray', 
		function($http, $q, $filter, globalSettings, $firebaseArray) {
		
		function TagService() {
			var self = this;
			
			//Attributes
			self.allTags = null;
			self.tagLookup = null;
			self.highlightLookup = null;
			
			self.cached = false;
			
			self.TYPE_TASKS = "Tasks";
			self.TYPE_PROJECTS = "Projects";
			self.TYPE_PEOPLE = "People";
			self.TYPE_JOURNAL = "Journal";
		
			//Getters
			self.getAllTags = function() {
			    var deferred = $q.defer();
			    
				if (self.cached && !globalSettings.shouldClearCache("tagSer_Tags")) {
					deferred.resolve(self.allTags);
				} else {
					globalSettings.initSettings().then(
						function() {
							if (!self.cached || globalSettings.shouldClearCache("tagSer_Tags")) {
								var lookupKey = "Workspaces/" + globalSettings.currWorkspace.$id + "/Settings/Tags"; 
								var ref = firebase.database().ref().child(lookupKey);
								
								self.allTags = $firebaseArray(ref);
								self.allTags.$loaded().then( 
									function(data) {
										self.cached = true;
										globalSettings.setCache("tagSer_Tags");
										globalSettings.log("tag.service", "getAllTags", "Tags Loaded");
										deferred.resolve(self.allTags);
								});
							} else {
								deferred.resolve(self.allTags);
							}

						});
				};
				
				return deferred.promise;
			};
			
			/*self.getHighlightLookup = function() {
			    var deferred = $q.defer();
			    
				if (self.highlightLookup != null) {
					deferred.resolve(self.highlightLookup);
				} else {
					globalSettings.initSettings().then(
						function() {
							if (self.highlightLookup == null) {
								var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id 
												+ "/Lookup/Highlight/" + globalSettings.currProfile.person; 
								var ref = firebase.database().ref().child(lookupKey);
								
								self.highlightLookup = $firebaseArray(ref);
								self.highlightLookup.$loaded().then( 
									function(data) {
										globalSettings.log("tag.service", "getTagLookup", "Highlighted Tag lookup Loaded");
										deferred.resolve(self.highlightLookup);
								});
							} else {
								deferred.resolve(self.highlightLookup);
							}

						});
				};
				
				return deferred.promise;
			};*/
			
			self.getTagLookup = function() {
			    var deferred = $q.defer();
			    
				if (self.tagLookup != null) {
					deferred.resolve(self.tagLookup);
				} else {
					globalSettings.initSettings().then(
						function() {
							if (self.tagLookup == null) {
								var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Lookup/Tag"; 
								var ref = firebase.database().ref().child(lookupKey);
								
								self.tagLookup = $firebaseArray(ref);
								self.tagLookup.$loaded().then( 
									function(data) {
										globalSettings.log("tag.service", "getTagLookup", "Tag lookup Loaded");
										self.cached = true;
										deferred.resolve(self.tagLookup);
								});
							} else {
								deferred.resolve(self.tagLookup);
							}

						});
				};
				
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
			
		    /*self.getAllDemoTags = function() {
			    var deferred = $q.defer();
			    
				if (self.allTags !== null) {
					deferred.resolve(self.allTags);
				} else {
					$http.get('assets/js/app/json/tag.json')
						.success(function(tags) {
							if (self.allTags == null) {
								self.allTags = tags;
							}
							
							for (var i=0; i<tags.length; i++) {
								tags[i].created = new Date();
					            tags[i].createdById = "12345";
					            tags[i].lastUpdated = new Date();
					            tags[i].lastUpdatedById = "12345";
							}
							
							deferred.resolve(self.allTags);
				    	})
				    	.error(function(response) {
					    	deferred.reject(response);
				    	});
				}
				
				return deferred.promise;
			};*/
			
			//Methods
			self.findTag = function(tagId) {
			    var deferred = $q.defer();
			    
			    self.getAllTags().then(
					function(tags) {
						deferred.resolve(self.lookupTags(tagId, tags));
					},
					function(result) {
						console.log("Failed to get the find tag, result is " + result); 
						deferred.resolve(null);
      				}
				);
				
				return deferred.promise;
			};
			
			self.lookupTags = function(tagId, tags) {
				var result = tags.$getRecord(tagId);
				
				return result;
			}

						
			self.toggleHighlight = function(src) {
				var tmp = src.isHighlighted == undefined ? false : src.isHighlighted;
				src.isHighlighted = !tmp;
				
				
				/*self.getHighlightLookup().then(
					function(tags) {
						var tagId = src.$id;
						var result = tags.$getRecord(tagId);
						
						if (result == null) {
							//Add highlight
					    	tags.$add(tagId).then(
					    		function(ref) {
								  globalSettings.log("tag.service", "toggleHighlight", "Tag: " +  ref.key);							  
								}, 
								function(error) {
								  globalSettings.logError("tag.service", "toggleHighlight", error);
							});
						} else {
							//Remove highlight
						}
					}
				);*/
			}
			
			self.retrieveTags = function(srcArr) {
				var deferred = $q.defer();
			    var result = [];
			    var tmp;
			    
			    self.getAllTags().then(
					function(tags) {
						angular.forEach(srcArr, function(value, key) {
							tmp = self.lookupTags(key, tags);
							if (tmp != null) {
								result.push(tmp);
							}
						});
						
						deferred.resolve(result);
					}
				);
				
				return deferred.promise;
			}
			
			self.populateTags = function(arr, tagfld, resultFld) {
				var deferred = $q.defer();
				
				self.getAllTags().then(
					function(tags) {
						/*
						var tmpTags;
					    var arrItem;
					    var arrTagIds;
					    
					    var ilen = arr.length;
					    var klen = tags.length;
					    var jlen = 0;
					    
					    for (var i=0; i<ilen; i++) {
							tmpTags = [];
							arrItem = arr[i];
							arrTagIds = arrItem[tagfld];
							
							if (arrTagIds != null) {
								jlen = arrTagIds.length;
								
								for (var j=0; j<jlen; j++) {
								
									for (var k=0; k<klen; k++) {
										if (tags[k].id == arrTagIds[j]) {
											tmpTags.push(tags[k]);
											break;
										}
									}
								}
							}
							arrItem[resultFld] = tmpTags;
						}
						*/
						
						deferred.resolve(true);
					}
				);
				
				return deferred.promise;
			}
			
			self.cloneTag = function (src, dest) {
			    var result = (dest == null) ? self.newTag() : dest;
				
				result.$id = src.$id;
				result.label = src.label;
	            result.color = src.color;
	            //result.isHighlighted = src.isHighlighted;
	            result.forTasks = src.forTasks;
	            result.forPeople = src.forPeople;
	            result.forProject = src.forProject;
	            result.forJournal = src.forJournal;
	            result.created = src.created;
		        result.createdName = src.createdName;
		        result.updated = src.updated;
		        result.updatedName = src.updatedName;
	            
	            return result;
		    };

		    self.newTag = function() {
				return {
					label: "",
					color: "#CCCCCC",
					//isHighlighted: false,
					forTasks: true,
					forPeople: true,
					forProject: true,
					forJournal: true
				};
			};
			
			self.deleteTag = function(src) {
			    var deferred = $q.defer();
				
				self.getAllTags().then(
					function(tags) {
						var tag = tags.$getRecord(src.$id);
						tags.$remove(tag);
						
						deferred.resolve(true);
					}
				);
				
				return deferred.promise;
		    };
		    
		    self.saveTag = function (edited, orig) {
			    var deferred = $q.defer();
			    
				self.getAllTags().then(
					function(tags) {
						if (orig == null) {
							tags.$add(self.createTagForSave(edited)).then(
								function(ref) {
								  globalSettings.log("tags.service", "saveTag", "Added tag: " +  ref.key);
								  deferred.resolve(ref);
								}, 
								function(error) {
								  globalSettings.logError("tags.service", "saveTag:Create", error);
								  deferred.resolve(orig);
							});
						} else {
							var tag = self.updateOrigTagForSave(edited, tags);
					    	tags.$save(tag).then(
					    		function(ref) {
								  globalSettings.log("tag.service", "saveTag", "Updated tag: " +  ref.key);
								  deferred.resolve(orig);
								  
								}, 
								function(error) {
								  globalSettings.logError("tag.service", "saveTag:Update", error);
								  deferred.resolve(orig);
							});
					    }
					}
				);
				
				return deferred.promise;
		    };
		    
		    self.createTagForSave = function(src) {
			    var result = {
				    			label: src.label,
								color: src.color,
								//isHighlighted: src.isHighlighted,
								forTasks: src.forTasks,
								forPeople: src.forPeople,
								forProject: src.forProject,
								forJournal: src.forJournal
							};
							
				globalSettings.updateTimestamp(result);			
	            
	            return result;
		    }
		    
		    self.updateOrigTagForSave = function(src, tags) {
			    var result = tags.$getRecord(src.$id);
			    			    
			    result.label = src.label;
				result.color = src.color;
				result.isHighlighted = false;
				result.forTasks = src.forTasks;
				result.forPeople = src.forPeople;
				result.forProject = src.forProject;
				result.forJournal = src.forJournal;
	            
	            globalSettings.updateTimestamp(result);
	            
	            return result;
		    }
		    
		    self.saveTagsForItem = function(itemKey, type, tagArr) {
			    var deferred = $q.defer();
			    var i=0;
			    var len=tagArr.length;
			    var tmp = {};
			    
			    var refKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/" + type + "/" + itemKey + "/tags/";
			    var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Lookup/Tag/";
			    var updates = {};
			    
			    for (i=0; i<len; i++) {
				    tmp = {
					    label: tagArr[i].label,
					    color: tagArr[i].color,
					    isHighlighted: false
				    };
				    
				    updates[refKey + tagArr[i].$id] = tmp;
				    updates[lookupKey + tagArr[i].$id + "/" + itemKey] = type;
				    
			    }
			    
				firebase.database().ref().update(updates);
				globalSettings.log("tag.service", "saveTagsForItem", "Item(" + type + "): " + itemKey + " Tags updated");
				
				deferred.resolve(true);
								
				return deferred.promise;
		    }
		    
		}
		
		return new TagService();
	}]);

}());