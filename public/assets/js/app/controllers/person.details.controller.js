(function() {
    'use strict';

    angular
        .module('app')
        .controller('PersonDetailsController', PersonDetailsController);

    PersonDetailsController.$inject = ['$scope', '$rootScope', '$state', '$window', '$filter', 'globalSettings', 
    	'globalNav', 'peopleService', 'projectService', 'activityService', 'journalService'];

    function PersonDetailsController($scope, $rootScope, $state, $window, $filter, globalSettings, globalNav, peopleService, projectService, activityService, journalService) {
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
	    $scope.activityGrouping = null;	
	    $scope.hideAvatar = true;
	    
        $scope.selectedPerson = peopleService.newPerson();
        
        $scope.maps = null;
        
        $scope.openDetails = function(person) {
	        $scope.showDetails = true;
	        
	        if (person == null){
		        $scope.selectedPerson = peopleService.newPerson();
	        } else {
	        	$scope.selectedPerson = person;
	        	$scope.refreshActivity();
	        	$scope.populateProject();
				$scope.populateJournal();
	        	activityService.addAccessActivity(activityService.TYPE_ACCESS, person, person.$id, activityService.TAR_TYPE_PERSON, person);   	
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
        
        $scope.openProjectDetails = function(project) {
	        $scope.closeDetails();
            $scope.nav.openProjectDetails(project.$id);
        }
        
        $scope.openEntryDetails = function(entry) {
	        $scope.closeDetails();
            $scope.nav.openJournalEditDetails(entry.$id);
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