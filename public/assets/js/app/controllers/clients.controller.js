(function() {
    'use strict';

    angular
        .module('app')
        .controller('ClientsController', ClientsController);

    ClientsController.$inject = ['$scope', '$state', '$stateParams', 'globalSettings', 'globalNav', 'peopleService'];

    function ClientsController($scope, $state, $stateParams, globalSettings, globalNav, peopleService) {
        $scope.$state = $state;
        $scope.display = $stateParams.display;
        $scope.gs = globalSettings;
        $scope.cardView = true;
        
        $scope.clientAliasPlural = "";
        
        $scope.orderByFld = 'last';
        $scope.orderLast = false;
        $scope.limit = 100;
        
        globalSettings.initSettings().then(
        	function() {
	        	$scope.clientAliasPlural = globalSettings.currWorkspace.Terminology.clientAliasPlural;	        	
	        	$scope.type = globalSettings.currWorkspace.Terminology.clientAlias;
	        	
	        	$scope.populatePeople();
		        
		        if ($scope.display == 'All') {
		        	$scope.search = {type:'Client', $:''};
		        } else if ($scope.display == 'Team') {
		        	$scope.search = {type:'Team member', $:''};
                    $scope.type = 'Team Member';
                } else if ($scope.display == 'Recent') {
                    $scope.search = {type:'Client', $:''};
                    $scope.orderByFld = 'updated';
                    $scope.orderLast = true;
		        } else {
			        $scope.search = {type:'Client', $:''};
		        }
        });
        
        $scope.populatePeople = function() {
	        peopleService.getAllPeople().then(
				function(people) {
                    $scope.people = people;

                    if ($scope.display == 'Recent') {
                        $scope.limit = 10;
                    } else {
                        $scope.limit = people.length;
                    }
			});
		}
		       
        $scope.updateOrderBy = function(orderBy) {    
            if (orderBy == 'First name') {
                $scope.orderByFld = 'first';
                $scope.orderLast = false;
            } else if (orderBy == 'Last name') {
               $scope.orderByFld = 'last';
               $scope.orderLast = true;
            } 
        }
                
        $scope.newClient = function() {
            $scope.nav.newPerson();
        }
        
        $scope.openDetails = function(client) {
            $scope.nav.openPeopleDetails(client.$id);
        }
        
    }
}());