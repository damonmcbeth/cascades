(function() {
    'use strict';

    angular
        .module('app')
        .controller('OrganizationController', OrganizationController);

    OrganizationController.$inject = ['$scope', '$state', 'globalSettings', 'globalNav', 'projectService', 'peopleService'];

    function OrganizationController($scope, $state, globalSettings, globalNav, projectService, peopleService) {
        $scope.$state = $state;        
        $scope.gs = globalSettings;
        
        $scope.editableOrg = {};
        
        $scope.search = {isAdmin:true};

        $scope.initEditableOrg = function() {
	        $scope.editableOrg = globalSettings.cloneWorkspace(globalSettings.currWorkspace);
        }
        
        globalSettings.initSettings().then(
	        function() {
		         $scope.org = globalSettings.currWorkspace;
				 $scope.initEditableOrg();
	        }
        )
        
        peopleService.getAllPeople().then(
	        function(people) {
		        $scope.admins = people;
	        }
        )
                
        $scope.saveOrg = function() {
	        globalSettings.saveOrg($scope.editableOrg, globalSettings.currWorkspace);
	        $scope.initEditableOrg();
	        
        }
        
        $scope.cancelEdit = function() {
	        $scope.initEditableOrg();
        }
        
        $scope.openDetails = function(admin) {
            globalNav.openPeopleDetails(admin);
        }
        
    }
}());