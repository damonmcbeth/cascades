(function() {
    'use strict';

    var app = angular.module('app');
    
    		
	app.factory('peopleService', ['$filter', '$http', '$q', '$firebaseArray', 'tagService', 'globalSettings', 
		function($filter, $http, $q, $firebaseArray, tagService, globalSettings) {
		
		function PeopleService() {
			var self = this;
			
			//Attributes
			self.allPeople = null;
			self.cached = false;
			
			self.TYPE_TASKS = "Tasks";
			self.TYPE_PROJECTS = "Projects";
			self.TYPE_JOURNAL = "Journal";
		
			self.personStates = ('New,Established').split(',').map(function(state) {
		        return {label: state};
		    });
		    
		    self.personTypes = ('Client,Team member').split(',').map(function(type) {
		        return {label: type};
		    });
		    
		    //Getters
		    self.getAllPeople = function() {
			    var deferred = $q.defer();
			    
				if (self.cached && !globalSettings.shouldClearCache("peopleSer_People")) {
					deferred.resolve(self.allPeople);
				} else {
					globalSettings.initSettings().then(
						function() {
							if (!self.cached || globalSettings.shouldClearCache("peopleSer_People")) {
								var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/People"; 
								var ref = firebase.database().ref().child(lookupKey);
								
								self.allPeople = $firebaseArray(ref);
								self.allPeople.$loaded().then( 
									function(data) {
										globalSettings.log("people.service", "getAllPeople", "People Loaded");
										self.cached = true;
										globalSettings.setCache("peopleSer_People");
										deferred.resolve(self.allPeople);
								});
							} else {
								deferred.resolve(self.allPeople);
							}

						});
				};
				
				return deferred.promise;
			};
			
			self.getCurrentUser = function() {
				var deferred = $q.defer();
				
				globalSettings.getCurrUserid().then(
					function(userid) {
						return self.findPerson(userid);
					}
				).then(
					function(person) {
						deferred.resolve(person);
					}
				);
				
				return deferred.promise;
			}
		    
		    
		    //Methods
		    self.initTags = function(people) {
			    var deferred = $q.defer();
				
				tagService.populateTags(people, "tagIds", "tags").then(
					function(done) {
						deferred.resolve(true);
					}
				);
				
				return deferred.promise;
		    }
			
			self.findPerson = function(uid) {
			    var deferred = $q.defer();
			    
			    self.getAllPeople().then(
					function(people) {
						deferred.resolve(self.lookupPerson(uid, people));				
					},
					function(result) {
						console.log("Failed to get the find person, result is " + result); 
						deferred.resolve(null);
      				}
				);
				
				return deferred.promise;
			};
			
			self.lookupPerson = function(personId, people) {
				var result = people.$getRecord(personId);
				
				return result;
			}
			
		    self.clonePerson = function (src, dest) {
				 var deferred = $q.defer();
			    
			    if (src == null) {
				    deferred.resolve(null);
			    } else {
				    var result = (dest == null) ? self.newPerson() : dest;
					
					result.$id = src.$id;
					result.name = src.name;
		            result.first = src.first;
		            result.last = src.last;
		            result.title = src.title;
		            result.avatar = src.avatar;
		            result.avatarType = src.avatarType;
		            result.isOwner = src.isOwner;
		            result.notes = src.notes;
		            result.isAdmin = src.isAdmin;
		            result.isUser = src.isUser;
		            result.type = src.type;
		            result.primaryPhone = src.primaryPhone;
		            result.secondaryPhone = src.secondaryPhone;
		            result.primaryEmail = src.primaryEmail;
		            result.state = src.state;

		            result.created = src.created;
		            result.createdName = src.createdName;
		            result.updated = src.updated;
					result.updatedName = src.updatedName;
					
					result.sendEmails = src.sendEmails;
					result.sendNotifications = src.sendNotifications;
		            
		            self.cloneAddresses(src, result);
		            
		            self.initPerson(result).then(
			            function(proj) {
				            deferred.resolve(proj);
			        });
	            }
	            
	            return deferred.promise;
		    };
		    
		    self.newPerson = function() {
				return {
					name: '',
					first: '',
					last:  '',
					avatar: '1.png',
					avatarType: 'Stock',
					isOwner: false,
					isAdmin: false,
					isUser: false,
					type:'Client',
					primaryPhone: '',
					secondaryPhone: '',
					primaryEmail: '',
					state: 'New',
		            tags: [],
		            addresses: [],
		            active: true,
					notes: '',
					sendEmails: true,
					sendNotifications: true
				};
			};
			
			self.cloneAddresses = function (src, dest) {
			    var len = src.addresses == null ? 0 : src.addresses.length;
			    var tmp;
			    var result = [];
			    
			    for (var i=0; i<len; i++) {
				    tmp = {
					    type: src.addresses[i].type,
		    			address: src.addresses[i].address
				    }
				    result.push(tmp);
			    }
			    
			    dest.addresses = result;
			    
		    }

			
			self.initPerson = function(person) {
			    var deferred = $q.defer();
			    
			    deferred.resolve(person);
			    
		        return deferred.promise;
	        }
		    
		    self.savePerson = function (edited, orig) {
			    var deferred = $q.defer();
			    
			    self.getAllPeople().then(
					function(people) {
						if (orig == null) {
							people.$add(self.createPersonForSave(edited)).then(
								function(ref) {
								  globalSettings.log("people.service", "savePerson", "Added Person: " +  ref.key);
								  edited.$id = ref.key;
								  tagService.saveTagsForItem(ref.key, tagService.TYPE_PEOPLE, edited.tags);

								  self.determineHighlightPeople();
								  deferred.resolve(orig);
								  
								}, 
								function(error) {
								  globalSettings.logError("people.service", "savePerson:Create", error);
								  deferred.resolve(orig);
							});
						} else {
							var person = self.updateOrigPersonForSave(edited, people);
					    	people.$save(person).then(
					    		function(ref) {
								  globalSettings.log("people.service", "savePerson", "Updated Person: " +  ref.key);
								  tagService.saveTagsForItem(ref.key, tagService.TYPE_PEOPLE, edited.tags);
								  
								  self.synchUserInfo(person);
								  self.determineHighlightPeople();
								  deferred.resolve(orig);
								}, 
								function(error) {
								  globalSettings.logError("people.service", "savePerson:Update", error);
								  deferred.resolve(orig);
							});
					    }
					}
				);
				
				return deferred.promise;
		    };
		    
		    self.synchUserInfo = function(person) {
			    if (person.isUser) {
				    globalSettings.getUserForPerson(person.$id).then(
					    function(users) {
						    if (users == null) {
							    globalSettings.createUser(person);
						    } else { 
							    globalSettings.updateUser(person);
						    }
					});
			    }
			    
		    }
		    
		    self.createPersonForSave = function(src) {
			    var result = {
				    			name: src.name,
								first: src.first,
								last:  src.last,
								title: src.title == null ? null : src.title,
								avatar: src.avatar,
								avatarType: src.avatarType,
								isOwner: src.isOwner,
								isAdmin: src.isAdmin,
								isUser: src.isUser,
								type: src.type,
								primaryPhone: src.primaryPhone == null ? null : src.primaryPhone,
								secondaryPhone: src.secondaryPhone== null ? null : src.secondaryPhone,
								primaryEmail: src.primaryEmail,
								state: src.state,
					            active: src.active,
					            addresses: src.addresses,
								notes: src.notes == null ? null : src.notes,
								sendEmails: src.sendEmails,
								sendNotifications: src.sendNotifications
							};
							
				globalSettings.updateTimestamp(result);			
	            
	            return result;
		    }
		    
		    self.updateOrigPersonForSave = function(src, people) {
			    var result = people.$getRecord(src.$id);
			    			
			    result.name = src.name;
				result.first = src.first;
				result.last =  src.last;
				result.title = src.title == null ? null : src.title;
				result.avatar = src.avatar;
				result.avatarType = src.avatarType;
				result.isOwner = src.isOwner == null ? false : src.isOwner;
				result.isAdmin = src.isAdmin;
				result.isUser = src.isUser == null ? false : src.isUser;
				result.type = src.type;
				result.primaryPhone = src.primaryPhone == null ? null : src.primaryPhone;
				result.secondaryPhone = src.secondaryPhone== null ? null : src.secondaryPhone;
				result.primaryEmail = src.primaryEmail;
				result.state = src.state;
	            result.active = src.active;
	            result.notes = src.notes == null ? null : src.notes;
	            result.addresses = src.addresses;
	            result.hasHighlightTag = false;
				result.tags = null;
				result.sendEmails = src.sendEmails == null ? true : src.sendEmails;
				result.sendNotifications = src.sendNotifications == null ? true : src.sendNotifications;
	            
	            globalSettings.updateTimestamp(result);
	            
	            return result;
		    }
		    
		    self.retrievePeople = function(srcArr) {
				var deferred = $q.defer();
			    var result = [];
			    var tmp;
			    
			    self.getAllPeople().then(
					function(people) {
						angular.forEach(srcArr, function(value, key) {
							tmp = self.lookupPerson(key, people);
							if (tmp != null) {
								result.push(tmp);
							}
						});
						
						deferred.resolve(result);
					}
				);
				
				return deferred.promise;
			}
		    
		    self.savePeopleForItem = function(itemKey, type, peopleArr) {
			    var deferred = $q.defer();
			    var i=0;
			    var len=peopleArr.length;
			    var tmp = {};
			    
			    var refKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/" + type + "/" + itemKey + "/people/";
			    var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Lookup/People/";
			    var updates = {};
			    
			    for (i=0; i<len; i++) {
				    tmp = {
					    id: peopleArr[i].$id, 
					    name: peopleArr[i].name,
					    title: peopleArr[i].title == undefined ? null : peopleArr[i].title,
					    avatar: peopleArr[i].avatar,
					    avatarType: peopleArr[i].avatarType,
					    primaryEmail: peopleArr[i].primaryEmail
				    };
				    
				    updates[refKey + peopleArr[i].$id] = tmp;
				    updates[lookupKey + peopleArr[i].$id + "/" + itemKey] = type;
				    
			    }
			    
				firebase.database().ref().update(updates);
				globalSettings.log("people.service", "savePeopleForItem", "Item(" + type + "): " + itemKey + " People updated");
				
				deferred.resolve(true);
								
				return deferred.promise;
		    }

		    
		    self.determineHighlightPeople = function() {
				var found = false;
				
				tagService.getAllTags().then(
					function(tags) {
						var tag;
						var srcTag;
						
						self.getAllPeople().then(					
							function(people) {
								var len = people.length;
								var person;
								
								for (var i=0; i<len; i++) {
									person = people[i];
									found = false;
									
									if (person.tags != undefined) {
										angular.forEach(person.tags, function(value, key) {
											srcTag = tagService.lookupTags(key, tags);
											if (srcTag != null && srcTag.isHighlighted) {
												found = true;
												return;
											}
										});
									}
									
									person.hasHighlightTag = found;
								}
						});
				})
			};
			
			
		}
		
		return new PeopleService();
		
	}]);

}());