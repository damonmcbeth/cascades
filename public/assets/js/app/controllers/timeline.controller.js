(function() {
    'use strict';

    angular
        .module('app')
        .controller('TimelineController', TimelineController);

    TimelineController.$inject = ['$scope', '$state', '$stateParams', '$filter', 'globalSettings', 
    	'globalNav', 'activityService'];

    function TimelineController($scope, $state, $stateParams, $filter, globalSettings, 
    						globalNav, activityService) {
	    
	    $scope.sDate = moment().startOf('day').toDate();
	    $scope.eDate = moment().endOf('day').toDate();
	    $scope.showCustom = false;
	    	    
	    switch($stateParams.rng) {
		    case "yesterday": 
		    	$scope.sDate = moment().subtract(1, 'days').startOf('day').toDate();
				$scope.eDate = moment().subtract(1, 'days').endOf('day').toDate();
				break;
			case "last7":
				$scope.sDate = moment().subtract(7, 'days').startOf('day').toDate();
				break;
			case "last30":
				$scope.sDate = moment().subtract(30, 'days').startOf('day').toDate();
				break;
			case "last60":
				$scope.sDate = moment().subtract(60, 'days').startOf('day').toDate();
				break;
			case "last90":
				$scope.sDate = moment().subtract(90, 'days').startOf('day').toDate();
				break;
			case "last14":
				$scope.sDate = moment().subtract(14, 'days').startOf('day').toDate();
				break;
			case "custom":
				$scope.sDate = moment().subtract(7, 'days').startOf('day').toDate();
				$scope.showCustom = true;		
	    }
	    
        $scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
        $scope.ac = activityService;
        $scope.search = "";
        
        $scope.activity = [];
        $scope.grouping = [];
               
        $scope.populateActivity = function() {
	        activityService.getActivity($scope.sDate, $scope.eDate).then(
				function(act) {
					
					var i = 0;
					var tmpGrouping = [];
					
					var orderedList = $filter('orderBy')(act,'updated', false);
					//var filteredList = $filter('filter')(orderedList, filter);
					var len = orderedList.length;
					
					for (i=0; i<len; i++) {
						tmpGrouping.uniquePush(activityService.calculateActivityGrouping(orderedList[i]));
					}
					
					
					$scope.grouping = tmpGrouping;
					$scope.activity = act;
			});
		}
		
		$scope.hasGroup = function(grp) {
	    	return ($filter('filter')($scope.activity, {groupingLabel: grp, $: $scope.search}, false)).length > 0;
    	}
		
	    globalSettings.initSettings().then(
        	function() {
	        	$scope.populateActivity();
        });
        
    }
}());