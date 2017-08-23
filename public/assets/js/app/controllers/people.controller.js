(function() {
    'use strict';

    angular
        .module('app')
        .controller('PeopleController', PeopleController);

    PeopleController.$inject = ['$scope', '$rootScope', '$state', '$window', 'globalSettings', 
    	'globalNav', 'peopleService', 'projectService', 'activityService'];

    function PeopleController($scope, $rootScope, $state, $window, globalSettings, globalNav, peopleService, projectService, activityService) {
        $scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
        
        peopleService.getAllPeople().then(
			function(people) {
				$scope.people = people;
		});
        
        
        $scope.personStates = peopleService.personStates;
        $scope.personTypes = peopleService.personTypes;
	    	    
	    $scope.closeOnSave = false;
	    
	    $scope.searchName = '';
	    $scope.grouping = $scope.personTypes;
	    $scope.viewByFld = 'Type';
	   
        $scope.openDetails = function(person) {
	        if (person == null) {
		        $scope.nav.newPerson();
	        } else {
	        	$scope.nav.openPeopleDetails(person.$id);
	        }        
	    }
        
	    $scope.updateViewBy = function(viewBy) {
		    $scope.viewByFld = viewBy;

		    switch (viewBy) {
	            case 'Relationship status':
	            	$scope.grouping = $scope.personStates; break;
	            case 'Type':
	            	$scope.grouping = $scope.personTypes; break;
	        } 
	    }
	    
	    $scope.getFilter = function(val) {
	        switch ($scope.viewByFld) {
	            case 'Relationship status':
	                return {state: val.label, name:$scope.searchName}; break;
	            case 'Type':
	            	return {type: val.label, name:$scope.searchName}; break;
	        }
    	}
    	
    	
    }
}());