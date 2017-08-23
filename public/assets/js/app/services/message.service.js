(function() {
    'use strict';

    var app = angular.module('app');
	
	app.factory('messageService', ['$filter', '$q', 'globalSettings', '$firebase', '$firebaseObject', 
								function($filter, $q, globalSettings, $firebase, $firebaseObject) {
		
		function MessageService() {
			var self = this;
			
			self.messaging = firebase.messaging();
			self.currentUser = null;
			
			self.getCurrentUser = function() {
			    var deferred = $q.defer();
			    
				if (!globalSettings.shouldClearCache("msgSer_CurrUser")) {
					deferred.resolve(self.currentUser);
				} else {
					globalSettings.initSettings().then(
						function() {
							if (globalSettings.shouldClearCache("msgSer_CurrUser")) {
								var personKey = globalSettings.currProfile.person;
								var lookupKey = "App/Workspaces/" + globalSettings.currWorkspace.$id + "/People/" + personKey; 
								var ref = firebase.database().ref().child(lookupKey);
								
								self.currentUser = $firebaseObject(ref);
								self.currentUser.$loaded().then( 
									function(data) {
										globalSettings.setCache("msgSer_CurrUser");
										deferred.resolve(self.currentUser);
								});
							} else {
								deferred.resolve(self.currentUser);
							}

						});
				};
				
				return deferred.promise;
			};
			
			self.requestPermission = function() {
				self.messaging.requestPermission()
					.then(function() {
						globalSettings.log("message.service", "requestPermission", "Notification permission granted.");
						self.initApplication();
					})
					.catch(function(err) {
						globalSettings.log("message.service", "requestPermission", "Unable to get permission to notify.");
					});					  
			}
			
			self.initApplication = function() {
			    self.messaging.getToken()
			    	.then(function(currentToken) {
				    	if (currentToken) {
				        	self.sendTokenToServer(currentToken);
							//self.updateUIForPushEnabled(currentToken);
							
							self.messaging.onMessage(function(payload) {
							    globalSettings.log("message.service", "initApplication", "Message received.");
								globalSettings.log("message.service", "initApplication", payload);
							    self.displayMessage(payload);
							});
				      	} else {
				        	globalSettings.log("message.service", "initApplication", "No Instance ID token available. Request permission to generate one.");
							self.setTokenSentToServer(false);
				      	}
				    }) 
				    .catch(function(err) {
					    globalSettings.log("message.service", "initApplication", "Error:" + err);
					  	self.setTokenSentToServer(false);
				    });
			}
			
			self.displayMessage = function(payload) {
				globalSettings.showInfoToast("GOT Message!!!!");
			}
			
			self.sendTokenToServer = function(currentToken) {
			    if (!self.isTokenSentToServer()) {
				    globalSettings.log("message.service", "sendTokenToServer", "Sending token to server...");
				    
				    self.getCurrentUser().then(
					    function(currUser) {
						    currUser.notificationToken = currentToken;
						    currUser.$save();
						    self.setTokenSentToServer(true);
					})
				    
			    } else {
				    globalSettings.log("message.service", "sendTokenToServer", "Token already sent to server so won\'t send it again unless it changes");
			    }
			}
			
			self.isTokenSentToServer = function() {
			    return window.localStorage.getItem('sentToServer') == 1;
			}
			
			self.setTokenSentToServer = function(sent) {
			    window.localStorage.setItem('sentToServer', sent ? 1 : 0);
			}
			

		}
		
		return new MessageService();
	}]);
}());