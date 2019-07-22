(function() {
    'use strict';

    var app = angular.module('app');
	
	app.factory('ticketsService', ['$filter', '$http', '$q', 'globalSettings', '$firebaseArray', 
								function($filter, $http, $q, globalSettings, $firebaseArray) {
		
		function TicketsService() {
			var self = this;
			
			self.allTickets = [];
			
			self.cached = false;
			
			
			self.getAllTickets = function() {
			    var deferred = $q.defer();
			    
				if (self.cached && !globalSettings.shouldClearCache("ticketSer_Tickets")) {
					deferred.resolve(self.allTickets);
				} else {
					globalSettings.initSettings().then(
						function() {
							if (!self.cached || globalSettings.shouldClearCache("ticketSer_Tickets")) {
								var lookupKey = "Logs/Tickets"; 
								var ref = firebase.database().ref().child(lookupKey);
								
								self.allTickets = $firebaseArray(ref);
								self.allTickets.$loaded().then( 
									function(data) {
										globalSettings.log("tickets.service", "getAllTickets", "Tickets Loaded");
										globalSettings.setCache("ticketSer_Tickets")
										self.cached = true;
										deferred.resolve(self.allTickets);
								});
							} else {
								deferred.resolve(self.allTickets);
							}

						});
				};
				
				return deferred.promise;
			};
				
			self.flushCache = function() {
				var deferred = $q.defer();
				
				self.cached = false;
				
				self.getAllTickets().then(
					function(tickets) {
						deferred.resolve(true);
				});
				
				return deferred.promise;
			}
			
			self.findTicket = function(tid) {
			    var deferred = $q.defer();
			    
			    self.getAllTickets().then(
					function(tickets) {
						deferred.resolve(self.lookupProject(tid, tickets));				
					},
					function(result) {
						console.log("Failed to get the find ticket, result is " + result); 
						deferred.resolve(null);
      				}
				);
				
				return deferred.promise;
			};
			
			self.lookupProject = function(ticketId, tickets) {
				var result = tickets.$getRecord(ticketId);
				
				return result;
			}
			
			self.closeTicket = function(ticket) {
				var deferred = $q.defer();
			    
			    self.getAllTickets().then(
					function(tickets) {
						ticket.status = "Closed";
						globalSettings.updateTimestamp(ticket);
						
						tickets.$save(ticket).then(
							function(result) {
								globalSettings.showSuccessToast("Ticket closed");
								deferred.resolve(true);
							}
						)
						
					}
				);
				
				return deferred.promise;
					
			}		  

		}
		
		return new TicketsService();
	}]);
}());