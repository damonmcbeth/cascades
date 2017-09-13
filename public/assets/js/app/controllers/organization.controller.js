(function() {
    'use strict';

    angular
        .module('app')
        .controller('OrganizationController', OrganizationController);

    OrganizationController.$inject = ['$scope', '$state', 'globalSettings', 'globalNav', 'projectService'];

    function OrganizationController($scope, $state, globalSettings, globalNav, projectService) {
        $scope.$state = $state;        
        $scope.gs = globalSettings;
        
        $scope.editableWrkSpc = {};
        $scope.wrkSpc;
        $scope.currUser;
        $scope.showDetails = false;

        globalSettings.initSettings().then(
	        function() {
                $scope.initCurrentUser();
	        }
        )

        $scope.initCurrentUser = function() {
            $scope.currUser = globalSettings.currProfile;
        }
                
        $scope.saveWrkSpc= function() {
	        globalSettings.saveOrg($scope.editableWrkSpc, $scope.wrkSpc);
            $scope.showDetails = false;
            globalSettings.showSuccessToast('Workspace updated.');
        }
        
        $scope.cancelEdit = function() {
	        $scope.showDetails = false;
        }
        
        $scope.openDetails = function(wrkSpc) {
            globalSettings.getWorkspace(wrkSpc.$id).then(
                function(w) {
                    $scope.wrkSpc = w;
                    $scope.editableWrkSpc = globalSettings.cloneWorkspace(w);
                    $scope.showDetails = true;
                }
            )
        }

        $scope.setAsDefault = function() {
            $scope.currUser.defaultWorkspace = $scope.wrkSpc.$id;
            $scope.currUser.$save().then(
                function(result) {
                    globalSettings.showSuccessToast('Workspace set as default.');
                }
            )  
        }
        
    }
}());