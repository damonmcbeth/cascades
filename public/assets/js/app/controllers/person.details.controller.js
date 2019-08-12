(function() {
    'use strict';

    angular
        .module('app')
        .controller('PersonDetailsController', PersonDetailsController);

    PersonDetailsController.$inject = ['$scope', '$rootScope', '$state', '$window', '$filter', 'globalSettings', '$sce', 
    	'globalNav', 'peopleService', 'projectService', 'activityService', 'journalService', 'taskService', 'taskActivityService'];

    function PersonDetailsController($scope, $rootScope, $state, $window, $filter, globalSettings, $sce, globalNav, peopleService, projectService, activityService, journalService, taskService, taskActivityService) {
        $scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
        
        $scope.ac = activityService;
                
        $scope.showDetails = true;
        
        $scope.personStates = peopleService.personStates;
        $scope.personTypes = peopleService.personTypes;
	    	    
		$scope.activity = null;
		$scope.projects = null;
		$scope.entries = null;
		$scope.tasks = null;
		$scope.taskGrouping = null;
	    $scope.activityGrouping = null;	
	    $scope.hideAvatar = true;
	    
        $scope.selectedPerson = peopleService.newPerson();
        
		$scope.maps = null;
		
		$scope.showArchive = false;

		$scope.toggleArchive = function() {
			$scope.showArchive = !$scope.showArchive;
		}

		$scope.showJournalArchive = false;

		$scope.toggleJournalArchive = function() {
			$scope.showJournalArchive = !$scope.showJournalArchive;
		}
        
        $scope.openDetails = function(person) {
	        $scope.showDetails = true;
	        
	        if (person == null){
		        $scope.selectedPerson = peopleService.newPerson();
	        } else {
	        	$scope.selectedPerson = person;
	        	$scope.refreshActivity();
	        	$scope.populateProject();
				$scope.populateJournal();
				$scope.populateTasks(person.$id);
	        	activityService.addAccessActivity(activityService.TYPE_ACCESS, person, person.$id, activityService.TAR_TYPE_PERSON, person);   	
	        }
        }
		
		$scope.formatContent = function(content) {
			return $sce.trustAsHtml(content);
		}

		$scope.populateTasks = function(personId) {
	        if ($scope.selectedPerson != null) {
				taskService.getTaskStates().then(
					function(list){
						var orderedList = list;

						taskService.getAllTasks().then(
							function(tasks) {
								var i = 0;
								var tmpGrouping = [];
								
								var len = orderedList.length;
								var cnt;

								for (i=0; i<len; i++) {
									cnt = ($filter('filter')(tasks, $scope.getFilter(orderedList[i]))).length;
									if (cnt > 0) {
										tmpGrouping.uniquePush(orderedList[i]);
									}
								}
								
								$scope.taskGrouping = tmpGrouping;
								$scope.tasks = tasks;
							}
						)
					}
				)
			}
		}
		
		$scope.getFilter = function(val) {
			if ($scope.showArchive) {
				return {status: val.label, $:$scope.selectedPerson.$id};
			} else {
				return {status: val.label, archived: '!', $:$scope.selectedPerson.$id};
			}
		}
		
		$scope.getJournalFilter = function() {
			if ($scope.showJournalArchive) {
				return {$:$scope.selectedPerson.$id};
			} else {
				return {archived: false, $:$scope.selectedPerson.$id};
			}
    	}

        $scope.populateJournal = function() {
	        if ($scope.selectedPerson != null) {
		    	journalService.getAllEntries().then(
			    	function(entries) {
				   		$scope.entries = entries; 	
			    });
		    }
        }
        
        $scope.populateProject = function() {
	        if ($scope.selectedPerson != null) {
		    	projectService.getAllProjects().then(
			    	function(projects) {
				   		$scope.projects = projects; 	
			    });
		    }
        }
        
        $scope.refreshActivity = function() {
	     	if ($scope.selectedPerson != null) {
		     	activityService.getRecentActivity().then(
					function(act) {
						var filter = {personId: $scope.selectedPerson.$id};
						
						activityService.determineRecentActivityGrouping(filter).then(
							function(tmpGrouping) {
								$scope.activityGrouping = tmpGrouping;
								$scope.activity = act;
						});
				});
	     	}   
        }

        
        $scope.buildAddressMap = function(addr, addrIndex) {
	        if (!addr.loaded) {
				this.determineCoordinates(addr, addrIndex);
			}
        }
        
        $scope.determineCoordinates = function(addr, addrIndex) {
    		var geocoder = new google.maps.Geocoder();
    		var map = '#addr' + addrIndex;
    		var gmap;
    		
    		geocoder.geocode({'address': addr.address}, function(results, status) {
				if (status === 'OK') {
			    	gmap = new GMaps({ div: map, lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng()});
			    	gmap.addMarker({ lat:  results[0].geometry.location.lat(),
										lng: results[0].geometry.location.lng(),
										title: addr.title
									});
					addr.loaded = true;
  				} 
			}); 
	        
        }
		
		$scope.openTaskDetails = function(taskItem) {
	    	if (taskItem == null) {
		    	globalNav.newTaskForPerson($scope.selectedPerson.$id);
		    } else {
	    		globalNav.openTaskDetails(taskItem.$id);
	    	}
		}

		$scope.updateTaskIsDone = function(item) {
	        taskActivityService.updateStatus(item, item.isDone);
        }

        $scope.openProjectDetails = function(project) {
	        $scope.closeDetails();
            $scope.nav.openProjectDetails(project.$id);
        }
        
        $scope.openEntryDetails = function(entry) {
			$scope.closeDetails();
			
			if (entry == null) {
				$scope.nav.newJournalEntry();
			} else {
				$scope.nav.openJournalEditDetails(entry.$id);
			}
        }
        
        $scope.editPerson = function() {
	        globalNav.editPeopleDetails($scope.selectedPerson.$id);
        }
        
        $scope.cancelEdit = function() {
	        $scope.closeDetails();
        }
        
        $scope.deletePerson = function() {
	        peopleService.deletePerson($scope.selectedPersonSrc);
	        $scope.closeDetails();

        }
        
        $scope.closeDetails = function() {
	        globalNav.hideSideEditForm();
        }
	        	
    	$scope.initAction = function() {
	    	if (globalNav.action == globalNav.ACTION_PEOPLE_OPEN_DETAILS
	    		&& globalNav.actionArg != null) {
		    	peopleService.findPerson(globalNav.actionArg).then(
		    		function(person) {
		    			$scope.openDetails(person);
		    	});		    	
	    	} else if (globalNav.action == globalNav.ACTION_PEOPLE_NEW) {
		    	$scope.openDetails(null);
	    	} 
	    	
	    	globalNav.clearAction();
    	}
    	
    	globalNav.registerEditController(globalNav.ACTION_PEOPLE, $scope.initAction);
    	$scope.initAction();
    }
}());