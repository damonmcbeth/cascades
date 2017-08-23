(function() {
    'use strict';

    angular
        .module('app')
        .controller('TicketsController', TicketsController);

    TicketsController.$inject = ['$scope', '$state', '$filter', 'globalSettings', 
    	'globalNav', 'ticketsService'];

    function TicketsController($scope, $state, $filter, globalSettings, 
    						globalNav, ticketsService) {
	    						
        $scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
        
        $scope.tickets;
               
        $scope.populateTickets = function() {
	        ticketsService.getAllTickets().then(
				function(ts) {
					$scope.tickets = ts;
			});
		}
		
		$scope.openTicketDetails = function(ticket) {
			globalNav.openTicketDetails(ticket.$id);
		} 
		
	    globalSettings.initSettings().then(
        	function() {
	        	$scope.populateTickets();
        });
        
    }
}());