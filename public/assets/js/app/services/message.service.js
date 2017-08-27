(function() {
    'use strict';

    var app = angular.module('app');
	
	app.factory('messageService', ['$filter', '$q', '$http', 'globalSettings', '$firebase', '$firebaseObject', 
								function($filter, $q, $http, globalSettings, $firebase, $firebaseObject) {
		
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
				globalSettings.showMsgToast(payload.notification.title, payload.notification.body, payload.notification.icon);
			}
			
			self.sendTokenToServer = function(currentToken) {
			    //if (!self.isTokenSentToServer()) {
				    globalSettings.log("message.service", "sendTokenToServer", "Sending token to server...");
				    
				    self.getCurrentUser().then(
					    function(currUser) {
						    currUser.notificationToken = currentToken;
							currUser.$save();
							globalSettings.log("message.service", "sendTokenToServer", "Updated token on Server");
						    //self.setTokenSentToServer(true);
					})
				    
			    //} else {
				//    globalSettings.log("message.service", "sendTokenToServer", "Token already sent to server so won\'t send it again unless it changes");
			    //}
			}
			
			self.isTokenSentToServer = function() {
			    return window.localStorage.getItem('sentToServer') == 1;
			}
			
			self.setTokenSentToServer = function(sent) {
			    window.localStorage.setItem('sentToServer', sent ? 1 : 0);
			}

			self.sendMessage = function(notifTo, notifBody, notifIcon) {
				var req= {
					method: 'POST',
					url: 'https://fcm.googleapis.com/fcm/send',
					headers: {
						"Authorization": "key=AAAAOqv0rEs:APA91bE0cGlnAk18xThXCqWYZXbTuz-TbXppp1GFN3vpPNtDsUPjtz7qFYkyC_HRqHPkoGDPOUZatyVc-5nSaOqmA8KUYDQU0izly7oSt8hRTzt6zn3kOBrQu0j9uczYrC5jvOj8U7Ar",
						"Content-Type": "application/json"
					},
					"data": {
						"to": notifTo,
						"notification": {
							"title": "CASCADES",
							"body": notifBody,
							"icon": notifIcon
						}
					}
				};

				$http(req).then(function successCallback(response) {
						globalSettings.log("message.service", "sendMessage", "Message sent successfully");
					}, function errorCallback(response) {
						globalSettings.log("message.service", "sendMessage", response.status);
				});
			}
			

		}
		
		return new MessageService();
	}]);
}());