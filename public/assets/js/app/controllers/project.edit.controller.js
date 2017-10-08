(function() {
    'use strict';

    angular
        .module('app')
        .controller('ProjectEditController', ProjectEditController);

    ProjectEditController.$inject = ['$scope', '$rootScope', '$state', '$q', '$filter', 'globalSettings', 
    	'globalNav', 'projectService', 'peopleService', 'activityService', 'insightsService', 'projectActivityService', 'tagService'];

    function ProjectEditController($scope, $rootScope, $state, $q, $filter, globalSettings, globalNav, 
    								projectService, peopleService, activityService, insightsService, projectActivityService, tagService) {
        $scope.$state = $state;
        $scope.gs = globalSettings;
        
        $scope.selectedProject = null;
        $scope.selectedProjectSrc = null;
        
        $scope.isEdit = true;
        $scope.showHints = false;
        
        $scope.projectTypes;
        
        $scope.projectStates = [
		    	{label: 'Open', code: 'Open'},
				{label: 'Completed', code: 'Done'}
        ];
		
		$scope.initView = function() {
	        var deferred = $q.defer();
			
			peopleService.getAllPeople().then(
				function(people) {
					$scope.people = people;
					
					projectService.getProjectTypes().then(
						function(types) {
							$scope.projectTypes = types;
							deferred.resolve(true);	
					});
			});
			    				
			return deferred.promise;
        }
	                    
        $scope.openDetails = function(project) {
	        $scope.initView().then(
		        function(result) { 
			        if (project == null) {
				        $scope.isEdit = false;
				        var tmp = projectService.newProject();
				        
				        projectService.initProject(tmp).then(
					        function(initedProject) {
						    	$scope.selectedProject = initedProject;   
					        }
				        )
				        
			        } else {
				        $scope.selectedProjectSrc = project;
			        	projectService.cloneProject(project, null).then(
					        function(clonedProject) {
						        tagService.retrieveTags(project.tags).then(
							        function(tags) {
								        clonedProject.tags = tags;
								        $scope.populateClients(project, clonedProject);
							    });   	  
					    });
		
			        }
			});
        }
        
        $scope.populateClients = function(project, clonedProj) {
	        peopleService.retrievePeople(project.people).then( 
	        	function(people) {
		        	clonedProj.people = people;
		        	$scope.selectedProject = clonedProj;
	        	}
	        )
        }
        
        $scope.cleanUpForSave = function() {
	        	        
	        $scope.selectedProject.ownerId = ($scope.selectedProject.owner == null) ? null : $scope.selectedProject.owner.$id;
	        $scope.selectedProject.ownerName = ($scope.selectedProject.owner == null) ? null : $scope.selectedProject.owner.name;
	        $scope.selectedProject.isDone = $scope.selectedProject.status == "Done";
	        
	        if ($scope.selectedProject.type == null) {
		        $scope.selectedProject.typeName = null;
		        $scope.selectedProject.typeId = null;
	        } else {
		        $scope.selectedProject.typeName = $scope.selectedProject.type.title;
		        $scope.selectedProject.typeId = $scope.selectedProject.type.$id;
	        }
	        
        }
        
        $scope.saveProject = function(isValid) {
	        if (isValid) {
		        $scope.cleanUpForSave();
				projectActivityService.save($scope.selectedProject, $scope.selectedProjectSrc).then(
					function(result) {
						if ($scope.isEdit) {
							insightsService.calProjectSummary($scope.selectedProject.$id);
						}
						
						activityService.addAccessActivity(activityService.TYPE_ACCESS, $scope.selectedProject, $scope.selectedProject.$id, 
															activityService.TAR_TYPE_PROJECT, null, $scope.selectedProject);
						
					}
				);
	        $scope.closeDetails();
	        } else {
		        $scope.showHints = true;
		        globalSettings.showErrorToast("Please correct errors before saving.");
	        }
        }
        
        $scope.cancelEdit = function() {
	        $scope.closeDetails();
        }
        
        $scope.deleteProject = function() {
	        projectService.deleteProject($scope.selectedProjectSrc);
	        $scope.closeDetails();
        }
        
        $scope.closeDetails = function() {
	        $scope.selectedProjectSrc = null;
		    globalNav.hideSideEditForm();
        }
        
        $scope.updateType = function() {
	        $scope.selectedProject.revenue = $scope.selectedProject.type.revenue;
        }
        
        $scope.querySearch = function(criteria) {
			return criteria ? $scope.people.filter($scope.createFilterFor(criteria)) : [];
    	}
    	
    	$scope.createFilterFor = function(query) {
		    var lowercaseQuery = angular.lowercase(query);
		
		    	return function filterFn(contact) {
		        	return (contact.name.toLowerCase().indexOf(lowercaseQuery) != -1);
		    };
	    }
        
        
    	$scope.initAction = function() {	    	
	    	if (globalNav.action == globalNav.ACTION_PROJECT_EDIT_DETAILS
	    		&& globalNav.actionArg != null) {
		    	projectService.findProject(globalNav.actionArg).then(
		    		function(project) {
		    			$scope.openDetails(project);
		    	});
	    	} else if (globalNav.action == globalNav.ACTION_PROJECT_NEW) {
		    	$scope.openDetails(null);
	    	} 
	    	
	    	globalNav.clearAction();
    	}
    	
    	$scope.clearEndDate = function() {
	    	$scope.selectedProject.end = null;
    	}
    	
    	$scope.clearStartDate = function() {
	    	$scope.selectedProject.start = null;
    	}
    
    	globalNav.registerEditController(globalNav.ACTION_PROJECT, $scope.initAction);
    	
    	$scope.initAction();
    }
}());