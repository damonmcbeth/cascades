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
        $scope.currPreferences = {};
        $scope.currWorkspace = {};
        $scope.userWorkspaces = {};

        $scope.newTaskStatus = null;
    
        $scope.defaultGroupings = [{ label: 'Schedule', value: 'Schedule'},
            { label: 'Status', value: 'State'},
            { label: 'Priority', value: 'Priority'}
        ];

        $scope.taskDueSoonOptions = [
            { label: 'In a day', value: 1},
            { label: 'In 3 days', value: 3},
            { label: 'In 5 days', value: 5},
            { label: 'In 10 days', value: 10},
            { label: 'In 30 days', value: 30},
            { label: 'In 60 days', value: 60}
        ];

        $scope.taskStatus = null;
        $scope.taskStatusList = [];

        globalSettings.initSettings().then(
	        function() {
                $scope.initCurrentPerson();
                $scope.initPreferences();
                $scope.initTaskStatusList();
	        }
        )

        $scope.initTaskStatusList = function() {
            globalSettings.retrieveWorkspaceTaskStatus().then(
                function(list) {
                    $scope.taskStatusList = list;
                }
            )
        }

        $scope.initPreferences = function() {
            $scope.currWorkspace = globalSettings.currWorkspace;
            $scope.userWorkspaces = globalSettings.userWorkspaces;
            $scope.currPreferences = globalSettings.currPreferences;
        }

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

        $scope.updateUserPreferences = function() {
           $scope.userWorkspaces.$save($scope.currPreferences).then(
                function(ref) {
                    //console.log(":)");
                }, 
                function(error) {
                    globalSettings.logError("settings.controller", "updateUserPreferences", error);
            });
        }

        $scope.resetPassword = function() {
            console.log("resetPassword");
           //peopleService.resetPassword($scope.currPerson);
        }

        $scope.addTaskStatus = function() {
            if ($scope.newTaskStatus != null && $scope.newTaskStatus != "") {
                var tmp = {
                    editable: true,
                    label: $scope.newTaskStatus,
                    order: 1
                };
                $scope.newTaskStatus = "";

                $scope.taskStatusList.$add(tmp).then(
                    function(ref) {
                        globalSettings.log("settings.controller", "addTaskStatus", "Added task status: " +  ref.key);
                    }, 
                    function(error) {
                        globalSettings.logError("settings.controller", "addTaskStatus", error);
                        deferred.resolve(orig);
                });   
            }
        }

        $scope.removeTaskState = function(taskState) {
            $scope.taskStatusList.$remove(taskState).then(
                function(ref) {
                    globalSettings.log("settings.controller", "removeTaskState", "Remove task status: " +  taskState.$id);
                }, 
                function(error) {
                    globalSettings.logError("settings.controller", "removeTaskState", error);
                    deferred.resolve(orig);
            });   
        }

        $scope.sortableOptions = {
            connectWith: ".connectList",
            disabled: false,
            dropId: null,
            update: function(event, ui) {
	            console.log("update");
            },
            stop: function(event, ui) {
	            globalSettings.log("task.service", "stop", "stop");
	            
	            globalSettings.log("task.service", "stop", "stop.dropId: " + this.dropId);
	            globalSettings.log("task.service", "stop", "stop.taskId: " + this.taskId);
	            
            }
        };
        
    }
}());