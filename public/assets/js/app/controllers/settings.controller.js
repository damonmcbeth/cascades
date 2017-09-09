(function() {
    'use strict';

    angular
        .module('app')
        .controller('SettingsController', SettingsController);

    SettingsController.$inject = ['$scope', '$state', 'globalSettings', 'globalNav', 'peopleService'];

    function SettingsController($scope, $state, globalSettings, globalNav, peopleService) {
        $scope.$state = $state;        
        $scope.gs = globalSettings;
        
        $scope.currPerson = {};
    
        globalSettings.initSettings().then(
	        function() {
                $scope.initCurrentPerson();
	        }
        )

        $scope.initCurrentPerson = function() {
            peopleService.findPerson($scope.gs.currProfile.person).then(
                function(person) {
                    $scope.currPerson = person;
                }
            )
        }

        $scope.updatePerson = function() {
            console.log($scope.currPerson);
            peopleService.getAllPeople().then(
                function(people) {
                    globalSettings.log("settings.controller", "updatePerson", $scope.currPerson);
                    people.$save($scope.currPerson);
                }
            )
        }

        $scope.resetPassword = function() {
            console.log("resetPassword");
           //peopleService.resetPassword($scope.currPerson);
        }
        
    }
}());