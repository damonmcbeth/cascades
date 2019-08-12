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
		
		$scope.dueDate;
		$scope.duePicker;

		$scope.options = {
		    height: 250,
		    airMode: false,
		    toolbar: [
				['color', ['color']],
				['fontsize', ['fontsize']],
				['style', ['bold', 'italic', 'underline', 'clear']],
				['alignment', ['ul', 'ol', 'paragraph']],
				['misc', ['undo']],
				['view', ['fullscreen']],
				['help', ['help']]

	        ]
		};

		$scope.dateOpts = {
			enableTime: false,
			dateFormat: "l M j, Y",
			disableMobile: true,
			onChange: function(selectedDates, dateStr, instance){
				//console.log("DATE CHANGED");
				if (selectedDates.length == 1) {
					$scope.selectedProject.end = selectedDates[0];
				}
			},
			onReady: function(selectedDates, dateStr, instance){
				$scope.duePicker = instance;
			}
		};
		  
		$scope.datePostSetup = function(fpItem) {
			//console.log('flatpickr', fpItem);
			//fpItem.setDate($scope.selectedTask.due, false);
		}
        
        $scope.projectStates = [
		    	{label: 'Open', code: 'Open'},
				{label: 'Closed', code: 'Done'}
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
								$scope.initDatePicker();    
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
		
		$scope.initDatePicker = function() {
			if ($scope.selectedProject != null && $scope.selectedProject.end != null) {
				var newDate = flatpickr.formatDate($scope.selectedProject.end, "l M j, Y")
				$scope.dueDate = newDate;
				$scope.duePicker.setDate(new Date($scope.selectedProject.end), false, "l M j, Y");
			}
        }
        
        $scope.populateClients = function(project, clonedProj) {
	        peopleService.retrievePeople(project.people).then( 
	        	function(people) {
		        	clonedProj.people = people;
					$scope.selectedProject = clonedProj;
					$scope.initDatePicker(); 
	        	}
	        )
        }
        
        $scope.cleanUpForSave = function() {
	        	        
	        // $scope.selectedProject.ownerId = ($scope.selectedProject.owner == null) ? null : $scope.selectedProject.owner.$id;
	        // $scope.selectedProject.ownerName = ($scope.selectedProject.owner == null) ? null : $scope.selectedProject.owner.name;
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
			$scope.dueDate = null;
    	}
    	
    	$scope.clearStartDate = function() {
	    	$scope.selectedProject.start = null;
    	}
    
    	globalNav.registerEditController(globalNav.ACTION_PROJECT, $scope.initAction);
    	
    	$scope.initAction();
    }
}());