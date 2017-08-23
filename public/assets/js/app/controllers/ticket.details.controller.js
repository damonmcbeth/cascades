(function() {
    'use strict';

    angular
        .module('app')
        .controller('TicketDetailsController', TicketDetailsController);

    TicketDetailsController.$inject = ['$scope', '$rootScope', '$state', 'globalSettings', 'globalNav', 'ticketsService'];

    function TicketDetailsController($scope, $rootScope, $state, globalSettings, globalNav, ticketsService) {
        $scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
                
        $scope.showDetails = true;
        $scope.selectedTicket;
        
        $scope.openDetails = function(ticket) {
	        $scope.selectedTicket = ticket; 
        }
        
        $scope.closeDetails = function() {
	        globalNav.hideSideEditForm();
        }
	        	
    	$scope.initAction = function() {
	    	if (globalNav.action == globalNav.ACTION_TICKET_OPEN_DETAILS
	    		&& globalNav.actionArg != null) {
		    	ticketsService.findTicket(globalNav.actionArg).then(
		    		function(ticket) {
		    			$scope.openDetails(ticket);
		    	});		    	
	    	} else if (globalNav.action == globalNav.ACTION_TICKET_NEW) {
		    	$scope.openDetails(null);
	    	} 
	    	
	    	globalNav.clearAction();
    	}
    	
    	$scope.closeTicket = function() {
	    	ticketsService.closeTicket($scope.selectedTicket).then(
		    	function(result) {
			    	$scope.closeDetails();
		    	}
	    	)
    	}
    	
    	globalNav.registerEditController(globalNav.ACTION_TICKET, $scope.initAction);
    	
    	$scope.initAction();
    }
}());