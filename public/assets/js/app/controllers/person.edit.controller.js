(function() {
    'use strict';

    angular
        .module('app')
        .controller('PersonEditController', PersonEditController);

    PersonEditController.$inject = ['$scope', '$rootScope', '$state', '$q', '$filter', '$timeout', '$window', 'globalSettings', 
    	'globalNav', 'projectService', 'peopleService', 'activityService', 'insightsService', 'peopleActivityService', 'tagService',
    	'storageService'];

    function PersonEditController($scope, $rootScope, $state, $q, $filter, $timeout, $window, globalSettings, globalNav, 
    								projectService, peopleService, activityService, insightsService, peopleActivityService, tagService,
    								storageService) {
        $scope.$state = $state;
        $scope.gs = globalSettings;
        
        var self = this;
        
        $scope.selectedPerson = null;
        $scope.selectedPersonSrc = null;
        
        $scope.isEdit = true;
        $scope.showHints = false;
		
		$scope.editAvatar = false;

        $scope.avatarTypes = ['Stock', 'Custom'];
        $scope.personTypes = [{label: globalSettings.currWorkspace.Terminology.clientAlias, value:'Client'}, {label: 'Team member', value: 'Team member'}];
        $scope.addressTypes = ['Home', 'Work', 'Other'];
        
        $scope.currAddress = {type:'Home', address:''};
		
		$scope.options = {
		    height: 250,
		    airMode: false,
		    toolbar: [
				['color', ['color']],
				['fontsize', ['fontsize']],
				['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
				['alignment', ['ul', 'ol', 'paragraph']],
				['misc', ['undo']],
				['help', ['help']]

	        ]
		};


		$scope.toggleAvatarEdit = function() {
			$scope.editAvatar = !$scope.editAvatar;
		}

		$scope.initView = function() {
	        var deferred = $q.defer();
			
			self.initAutocomplete();
			
			storageService.getCustomAvatars().then(
				function(people) {
					$scope.customAvatars = people;
					deferred.resolve(true);	
			});

						    				
			return deferred.promise;
        }
	                    
        $scope.openDetails = function(person) {
	        $scope.initView().then(
		        function(result) { 
			        if (person == null) {
				        $scope.isEdit = false;
				        var tmp = peopleService.newPerson();
				        
				        peopleService.initPerson(tmp).then(
					        function(initedPerson) {
						    	$scope.selectedPerson = initedPerson;
						    	$scope.setDefaultFocus();   
					        }
				        )
				        
			        } else {
				        $scope.selectedPersonSrc = person;
			        	peopleService.clonePerson(person, null).then(
					        function(clonedPerson) {
						        tagService.retrieveTags(person.tags).then(
							        function(tags) {
								        clonedPerson.tags = tags;
								        $scope.selectedPerson = clonedPerson; 
								        $scope.setDefaultFocus();
							    });   	  
					    });
		
			        }
			});
        }
        
        $scope.setDefaultFocus = function() {
	        $timeout(function() {
        		var element = $window.document.getElementById('firstName');
				if (element) {
					element.focus();
				}
			});
      	}
        
        $scope.cleanUpForSave = function() {
	        $scope.selectedPerson.name = $scope.selectedPerson.first + " " + $scope.selectedPerson.last;
	        
        }
        
        $scope.selectAvatar = function(img) {
	        if ($scope.selectedPerson != null) {
				$scope.selectedPerson.avatarType = "Stock";
		        $scope.selectedPerson.avatar = img;
	        }
		}

		$scope.onFileUploaded = function(result) {
			//console.log(result);
			$scope.selectedPerson.avatarType = "Custom";
			$scope.selectedPerson.avatar = result.downloadURL;
		}
        
        $scope.savePerson = function(isValid) {
	        if (isValid) {

		        $scope.cleanUpForSave();
				peopleActivityService.save($scope.selectedPerson, $scope.selectedPersonSrc).then(
					function(result) {
						if ($scope.isEdit) {
							//insightsService.calProjectSummary($scope.selectedPerson.$id);
						}
						
						activityService.addAccessActivity(activityService.TYPE_ACCESS, $scope.selectedPerson, $scope.selectedPerson.$id, 
															activityService.TAR_TYPE_PERSON, $scope.selectedPerson);
						
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
	        projectService.deleteProject($scope.selectedPersonSrc);
	        $scope.closeDetails();
        }
        
        $scope.closeDetails = function() {
	        $scope.selectedPersonSrc = null;
		    globalNav.hideSideEditForm();
        }
        
        $scope.addAddress = function() {
	    	var tmp = {
		    			type: $scope.currAddress.type,
		    			address: $scope.currAddress.address
	    			};
	    	
	    	if (tmp.address != null && tmp.address != "") {
	    		$scope.selectedPerson.addresses.push(tmp);
	    	}
    	}
    	
    	$scope.removeAddress = function(item) {
	    	if (item != null) {
		    	$scope.selectedPerson.addresses.splice($scope.selectedPerson.addresses.indexOf(item), 1);
		    }
    	}
        
        
    	$scope.initAction = function() {	    	
	    	if (globalNav.action == globalNav.ACTION_PEOPLE_OPEN_EDIT
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
    
		self.initAutocomplete = function() {
			var aComp = document.getElementById('autocomplete');
			//$scope.autocomplete = new google.maps.places.Autocomplete(
			
	        $scope.autocomplete = new google.maps.places.SearchBox(
	        	(aComp),
	            {types: ['geocode']});
	    }
	    
	    $scope.geolocate = function() {
	        if (navigator.geolocation) {
	          navigator.geolocation.getCurrentPosition(function(position) {
	            var geolocation = {
	              lat: position.coords.latitude,
	              lng: position.coords.longitude
	            };
	            var circle = new google.maps.Circle({
	              center: geolocation,
	              radius: position.coords.accuracy
	            });
	            $scope.autocomplete.setBounds(circle.getBounds());
	          });
	        }
	    }
		
		$scope.sendResetEmail = function() {
			if ($scope.selectedPerson.isUser 
				&& $scope.selectedPerson.primaryEmail != null && $scope.selectedPerson.primaryEmail != "") {
				globalSettings.sendPasswordResetEmail($scope.selectedPerson.primaryEmail);
			}
		}
		
    	globalNav.registerEditController(globalNav.ACTION_PROJECT, $scope.initAction);
    	
    	$scope.initAction();
    }
}());