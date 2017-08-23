(function() {
    'use strict';

    var app = angular.module('app');
	
	app.factory('storageService', ['$filter', '$q', 'globalSettings', 'firebase', '$firebaseStorage', '$firebaseArray',
								function($filter, $q, globalSettings, firebase, $firebaseStorage, $firebaseArray) {
		
		function StorageService() {
			var self = this;
			
			self.avatars = null;
			
			self.getCustomAvatars = function() {
			    var deferred = $q.defer();
			    
			    if (self.avatars != null)  {
				    deferred.resolve(self.avatars);
			    } else {
					globalSettings.initSettings().then(
						function() {
							var personKey = globalSettings.currProfile.person;
							var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Storage/Avatars/" + personKey; 
							var ref = firebase.database().ref().child(lookupKey);
							
							self.avatars = $firebaseArray(ref);
							self.avatars.$loaded().then( 
								function(data) {
									globalSettings.log("storage.service", "getCustomAvatars", "Avatars Loaded");
									deferred.resolve(self.avatars);
							});
	
					});
				}
				
				return deferred.promise;
			};
			
			self.saveUploadMetadata = function(file, metaData, loc, personKey) {
				var fileRef = {
					name: file.name,
					contentType: file.type,
					size: file.size,
					downloadURL: metaData.downloadURL,
					status: "active"
				};
				
				globalSettings.updateTimestamp(fileRef);
			
				var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/Storage/" + loc + "/" + personKey;
				var fileKey = firebase.database().ref().child(lookupKey).push().key;
				var updates = {};
				updates[lookupKey + "/" + fileKey] = fileRef;
				firebase.database().ref().update(updates);
			}
			
			self.uploadFile = function(loc, file) {
				
				var deferred = $q.defer();
				
				var personKey = globalSettings.currProfile.person;
				var ts = (new Date()).getTime();
				var storageKey = loc + "/" + personKey + "/" + ts + "_" + file.name;
							
				var storageRef = firebase.storage().ref(storageKey);
				var storage = $firebaseStorage(storageRef);
				var uploadTask = storage.$put(file);
				
				uploadTask.$error(function(error) {
					globalSettings.logError("storage.service", "uploadFile", error);
					deferred.resolve(null);
				})
				
				uploadTask.$complete(function(snapshot) {
					globalSettings.log("storage.service", "uploadFile", snapshot.downloadURL);
					self.saveUploadMetadata(file, snapshot, loc, personKey);
					deferred.resolve(snapshot);
				});
				
				return deferred.promise;
	
			}  

		}
		
		return new StorageService();
	}]);
}());