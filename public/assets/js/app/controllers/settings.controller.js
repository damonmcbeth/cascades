(function() {
    'use strict';

    angular
        .module('app')
        .controller('SettingsController', SettingsController);

    SettingsController.$inject = ['$scope', '$state', 'globalSettings', 'globalNav', 'peopleService', 'projectService'];

    function SettingsController($scope, $state, globalSettings, globalNav, peopleService, projectService) {
        $scope.$state = $state;        
        $scope.gs = globalSettings;
        
        $scope.currPerson = {};
        $scope.currPreferences = {};
        $scope.currWorkspace = {};
        $scope.userWorkspaces = {};

        $scope.newTaskStatus = null;
        $scope.newProjectType = null;
    
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
        $scope.taskStatusListSrc = [];
        $scope.projectTypeList = [];
        $scope.projectTypeListSrc = [];


        globalSettings.initSettings().then(
	        function() {
                $scope.initCurrentPerson();
                $scope.initPreferences();
                $scope.initTaskStatusList();
                $scope.initProjectTypeList();
	        }
        )

        $scope.initProjectTypeList = function() {
            projectService.getProjectTypes().then(
                function(types) {
                    $scope.projectTypeListSrc = types;
                    $scope.refreshProjectTypeList();
            });
        }

        $scope.initTaskStatusList = function() {
            globalSettings.retrieveWorkspaceTaskStatus().then(
                function(list) {
                    $scope.taskStatusListSrc = list;
                    $scope.refreshTaskStatusList();
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

        $scope.refreshTaskStatusList = function() {
            $scope.taskStatusList = [];
            $scope.taskStatusList.pushAll($scope.taskStatusListSrc);
        }

        $scope.refreshProjectTypeList = function() {
            $scope.projectTypeList = [];
            $scope.projectTypeList.pushAll($scope.projectTypeListSrc);
        }

        $scope.addProjectType = function() {
            if ($scope.newProjectType != null && $scope.newProjectType != "") {
                var tmp = {
                    revenue: 0,
                    title: $scope.newProjectType,
                    name: $scope.newProjectType
                };
                $scope.newProjectType = "";

                $scope.projectTypeListSrc.$add(tmp).then(
                    function(ref) {
                        globalSettings.log("settings.controller", "addProjectType", "Added project type: " +  ref.key);
                        $scope.refreshProjectTypeList();
                    }, 
                    function(error) {
                        globalSettings.logError("settings.controller", "addProjectType", error);
                        deferred.resolve(orig);
                });   
            }
        }

        $scope.removeProjectType = function(projectType) {
            $scope.projectTypeListSrc.$remove(projectType).then(
                function(ref) {
                    globalSettings.log("settings.controller", "removeProjectType", "Remove project type: " +  projectType.$id);
                    $scope.refreshProjectTypeList();
                }, 
                function(error) {
                    globalSettings.logError("settings.controller", "removeProjectType", error);
                    deferred.resolve(orig);
            });   
        }

        $scope.updateProjectType = function(projectType) {
            $scope.projectTypeListSrc.$save(projectType).then(
                function(ref) {
                    globalSettings.log("settings.controller", "updateProjectType", "Updated project type: " +  projectType.$id);
                }, 
                function(error) {
                    globalSettings.logError("settings.controller", "updateProjectType", error);
                    deferred.resolve(orig);
            });   
        }

        $scope.addTaskStatus = function() {
            if ($scope.newTaskStatus != null && $scope.newTaskStatus != "") {
                var tmp = {
                    editable: true,
                    label: $scope.newTaskStatus,
                    order: 1
                };
                $scope.newTaskStatus = "";

                $scope.taskStatusListSrc.$add(tmp).then(
                    function(ref) {
                        globalSettings.log("settings.controller", "addTaskStatus", "Added task status: " +  ref.key);
                        $scope.refreshTaskStatusList();
                    }, 
                    function(error) {
                        globalSettings.logError("settings.controller", "addTaskStatus", error);
                        deferred.resolve(orig);
                });   
            }
        }

        $scope.removeTaskState = function(taskState) {
            $scope.taskStatusListSrc.$remove(taskState).then(
                function(ref) {
                    globalSettings.log("settings.controller", "removeTaskState", "Remove task status: " +  taskState.$id);
                    $scope.refreshTaskStatusList();
                }, 
                function(error) {
                    globalSettings.logError("settings.controller", "removeTaskState", error);
                    deferred.resolve(orig);
            });   
        }

        $scope.updateTaskState = function(taskState) {
            $scope.taskStatusListSrc.$save(taskState).then(
                function(ref) {
                    globalSettings.log("settings.controller", "updateTaskState", "Updated task status: " +  taskState.$id);
                }, 
                function(error) {
                    globalSettings.logError("settings.controller", "updateTaskState", error);
                    deferred.resolve(orig);
            });   
        }

        $scope.updateOrder = function() {
            var i = 0;
            var len = $scope.taskStatusList.length;
            var result = [];
            var item = null;

            //console.log("PRINTING ORDER");
            for (i=0; i<len; i++) {
                item = $scope.taskStatusList[i];
                console.log(i + ". " + item.label + " ORDER:" + item.order);
                if (item.order != i) {
                    item.order = i;
                    $scope.taskStatusListSrc.$save(item);
                }
            }
            //console.log("DONE");
        }

        $scope.sortableOptions = {
            connectWith: ".connectTaskStateList",
            stop: function(event, ui) {
                globalSettings.log("settings.controller", "stop", "stop");
                $scope.updateOrder();
            },
            items: "div:not(.last-sortable)"
        };
        
    }
}());