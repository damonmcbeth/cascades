(function() {
    'use strict';

    angular
        .module('app')
        .controller('RecentTimelineController', RecentTimelineController);

    RecentTimelineController.$inject = ['$scope', '$state', '$filter', 'globalSettings', 
    	'globalNav', 'activityService'];

    function RecentTimelineController($scope, $state, $filter, globalSettings, 
    						globalNav, activityService) {
	    						
        $scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
        $scope.ac = activityService;
        
        $scope.activity = [];
        $scope.grouping = [];
               
        $scope.populateActivity = function() {
	        activityService.getRecentActivity().then(
				function(act) {
					var personKey = globalSettings.currProfile.person;
					var filter = {createdBy: personKey};
					
					activityService.determineRecentActivityGrouping(filter).then(
						function(tmpGrouping) {
							$scope.activity = act;
							$scope.grouping = tmpGrouping;
							
					});
			});
		}		
		
	    globalSettings.initSettings().then(
        	function() {
	        	$scope.populateActivity();
        });
        
    }
}());