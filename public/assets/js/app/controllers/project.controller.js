(function() {
    'use strict';

    angular
        .module('app')
        .controller('ProjectController', ProjectController);

    ProjectController.$inject = ['$scope', '$state', '$stateParams', '$window', '$filter', 'globalSettings', 'projectService', 'taskService'];

    function ProjectController($scope, $state, $stateParams, $window, $filter, globalSettings, projectService, taskService) {
        $scope.$state = $state;        
        $scope.display = $stateParams.display;
        $scope.cardView = true; 
        $scope.gs = globalSettings;
        
        globalSettings.initSettings().then(
        	function() {
	        	$scope.org = globalSettings.currWorkspace.Terminology;
				$scope.projAliasPlural = globalSettings.currWorkspace.Terminology.projectAliasPlural;
	        	
	        	$scope.populateProjects();	 
	        	
	        	$scope.orderByFld = 'title';
	        	
	        	if ($scope.display == 'Completed') {
		        	$scope.search = {status:'Done', $:''};
		        } else if ($scope.display == 'My') {
		        	$scope.search = {ownerId:globalSettings.currProfile.person, status:'Open', $:''};
		        } else {
			        $scope.search = {status:'Open', $:''};
		        }       	
        });
        
        $scope.populateProjects = function() {
	        projectService.getAllProjects().then(
				function(projects) {
					projectService.determineProgress();
					$scope.projects = projects;
			});
		}
        
        $scope.cardOptions = {
            animate:{
                duration:500,
                enabled:true
            },
            barColor:'#009000',
            scaleLength: 0,
            lineWidth: 8,
            lineCap:'square',
            size:90
        };
        
        $scope.options = {
            animate:{
                duration:500,
                enabled:true
            },
            barColor:'#009000',
            scaleLength: 0,
            lineWidth:4,
            lineCap:'square',
            size:50
        };
		
		$scope.openDetails = function(project) {
            $scope.nav.openProjectDetails(project.$id);
        }
        
        $scope.newProject = function() {
            $scope.nav.newProject();
        }
        
        $scope.openPersonDetails = function(personId) {
            $scope.nav.openPeopleDetails(personId);
        }
        
        $scope.determineProgress = function() {
        	projectService.determineProgress();
        }
        
        $scope.determineTotalTasks = function(project) {
	        if (project.projTasks == null) {
		        return 0;
	        } else {
		        return project.projTasks.length;
	        }
        }
        
        $scope.determineTotalNotes = function(project) {
	        if (project.projNotes == null) {
		        return 0;
	        } else {
		        return project.projNotes.length;
	        }
        }
        
        //taskService.registerController($scope.determineProgress);
    }
}());