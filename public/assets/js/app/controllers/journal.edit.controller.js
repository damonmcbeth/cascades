(function() {
    'use strict';

    angular
        .module('app')
        .controller('JournalEntryEditController', JournalEntryEditController);

    JournalEntryEditController.$inject = ['$scope', '$window', '$rootScope', '$state', '$q', 'globalSettings', 'tagService',
    										'$timeout', 'globalNav', 'journalService', 'peopleService', 'journalActivityService',
    										'storageService', 'projectService','activityService'];

    function JournalEntryEditController($scope, $window, $rootScope, $state, $q, globalSettings, tagService,
    									$timeout, globalNav, journalService, peopleService, journalActivityService,
    									storageService, projectService, activityService) {
        $scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
        
        $scope.isEdit = true;
        $scope.showHints = false;
        
        $scope.content = "";
	    $scope.options = {
		    height: 300,
		    airMode: false,
		    toolbar: [
			    ['para', ['style']],
				['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
				['fontsize', ['fontsize']],
	            ['fontclr', ['color']],
	            ['alignment', ['ul', 'ol', 'paragraph']],
				['insert', ['link', 'table', 'hr']],
				['misc', ['undo']],
	            ['view', ['fullscreen', 'codeview']]
	        ]
		};
		
		$scope.showProgress = false;
		var progress = $('#progressBar');
		
		$scope.projects = null;
		$scope.owners = null;
		$scope.people = [];
		  
		$scope.initView = function() {
	        var deferred = $q.defer();
			
			peopleService.getAllPeople().then(
				function(people) {
					$scope.owners = people;
					$scope.people = people;
					
					projectService.getAllProjects().then(
						function(projects) {
							$scope.projects = projects;
							deferred.resolve(true);	
					});
			});
						    				
			return deferred.promise;
        }
	    
	    $scope.openAttachment = function(url){
            $window.open(url, '_blank');
        };
	    
	    $scope.cancelEdit = function() {
	        $scope.closeDetails();
        }
        
        $scope.closeDetails = function() {
	        $scope.selectedEntrySrc = null;
		    globalNav.hideSideEditForm();
        }
        
        $scope.selectedEntry = journalService.newEntry();
        $scope.selectedEntrySrc = null;
          
        $scope.openDetails = function(entry) {
	        $scope.initView().then(
		        function(result) { 
			        if (entry == null) {
				        $scope.isEdit = false;
				        var tmp = journalService.newEntry();
				        
				        journalService.initEntry(tmp).then(
					        function(initedEntry) {
						    	$scope.selectedEntry = initedEntry;
						    	$scope.initEditor();
						    	$scope.setDefaultFocus();
					        }
				        )
				        
			        } else {
				        $scope.selectedEntrySrc = entry;
			        	journalService.cloneEntry(entry, null).then(
					        function(clonedEntry) {
						        tagService.retrieveTags(entry.tags).then(
							        function(tags) {
								        clonedEntry.tags = tags;
								        $scope.populateRelatedPeople(entry, clonedEntry);
								        $scope.initEditor(); 
								        $scope.setDefaultFocus();
								        journalService.markAsRead(entry.$id);
								        
								        //actType, tar, tarId, tarType, pers, proj, detail1, detail2
										activityService.addAccessActivity(activityService.TYPE_ACCESS, entry, entry.$id, activityService.TAR_TYPE_JOURNAL, null, null);   	
							    });   	  
					    });
		
			        }
			});
        }
        
        $scope.populateRelatedPeople = function(entry, clonedEntry) {
	        peopleService.retrievePeople(entry.people).then( 
	        	function(people) {
		        	clonedEntry.people = people;
		        	$scope.selectedEntry = clonedEntry;
	        	}
	        )
        }
        
        $scope.setDefaultFocus = function() {
	        $timeout(function() {
        		var element = $window.document.getElementById('entryTitle');
				if (element) {
					element.focus();
				}
			});
      	}
                              
        $scope.initEditor = function() {
	        $('#summernote').summernote();
	        $('#summernote').summernote('reset');
	        $('#summernote').summernote('insertText', $scope.selectedEntry.content);
	        
        }
        
        $scope.cleanUpForSave = function() {
	        if ($scope.selectedEntry.target == null || $scope.selectedEntry.target == "") {
		        $scope.selectedEntry.targetName = null;
		        $scope.selectedEntry.targetId = null;
	        } else {
	        	$scope.selectedEntry.targetName = $scope.selectedEntry.target.first + " " + $scope.selectedEntry.target.last;
	        	$scope.selectedEntry.targetId = ($scope.selectedEntry.target == null) ? null : $scope.selectedEntry.target.$id;
	        	
	        	if ($scope.selectedEntry.targetId != $scope.selectedEntrySrc.targetId) {
		        	$scope.selectedEntry.status = "Unread";
	        	}
	        }
	        
	        if ($scope.selectedEntry.project == null || $scope.selectedEntry.project == "") {
		        $scope.selectedEntry.project = null;
		        $scope.selectedEntry.projectId = null;
	        } else {
		        $scope.selectedEntry.projectId = $scope.selectedEntry.project.$id;
	        }
	        
        }
        
        $scope.saveEntry = function(isValid) {
	        if (isValid) {
		        $scope.cleanUpForSave();
				journalActivityService.save($scope.selectedEntry, $scope.selectedEntrySrc).then(
					function(result) {
						if ($scope.isEdit) {
							//insightsService.calProjectSummary($scope.selectedPerson.$id);
						}
						
						//activityService.addAccessActivity(activityService.TYPE_ACCESS, $scope.selectedPerson, $scope.selectedPerson.$id, 
						//									activityService.TAR_TYPE_PERSON, $scope.selectedPerson);
					}
				);
		        $scope.closeDetails();
		    } else {
			    $scope.showHints = true;
			    globalSettings.showErrorToast("Please correct errors before saving.");

		    }
        }
        
        $scope.initAction = function() {
	    	if (globalNav.action == globalNav.ACTION_JOURNAL_ENTRY_EDIT
	    		&& globalNav.actionArg != null) {
		    		
		    	journalService.findEntry(globalNav.actionArg).then(
		    		function(entry) {
		    			$scope.openDetails(entry);
		    	});
	    	} else if (globalNav.action == globalNav.ACTION_JOURNAL_ENTRY_NEW) {
		    	$scope.openDetails(null);
	    	} 
	    	
	    	globalNav.clearAction();
    	}
    	
    	$scope.archiveEntry = function() {
	    	journalActivityService.archive($scope.selectedEntry).then(
		    	function(result) {
			    	$scope.closeDetails();
		    	}
	    	);
    	}
    	
    	$scope.restoreEntry = function() {
	    	journalActivityService.restore($scope.selectedEntry).then(
		    	function(result) {
			    	$scope.closeDetails();
		    	}
	    	);
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
		
		$scope.handleStartChanged = function() {
	    	$scope.cleanUpDateRange();
    	}
    	
    	$scope.cleanUpDateRange = function() {
	    	if ($scope.selectedEntry.end != null && $scope.selectedEntry.start.getTime() >= $scope.selectedEntry.end.getTime()) {
		    	var end = moment($scope.selectedEntry.start).add(1, 'hours');
		    	$scope.selectedEntry.end = end.toDate();
	    	}
    	}
    	
    	$scope.handleEndChanged = function() {
	    	$scope.cleanUpDateRange();
    	}

    	$scope.clearStartDate = function() {
			$scope.selectedEntry.start = null;
			$scope.clearEndDate();
		}
		
		$scope.clearEndDate = function() {
	    	$scope.selectedEntry.end = null;
    	}
    	
    	$scope.onfileUploadChange = function onChange(loc, fileList, uploadCtrl) {
			var file = fileList[0];
			
			if (file != null) {
				progress.removeClass('ng-hide');
				
				storageService.uploadFile(loc, file).then(
					function(metaData) {
						progress.addClass('ng-hide');
						
						var attachment = {
							title: file.name,
							type: file.type,
							url: metaData.downloadURL
						};
						
						$scope.selectedEntry.attachments.push(attachment);
				})
			}
    	}
    	
    	$scope.removeAttachment = function(item) {
	    	if (item != null) {
		    	$scope.selectedEntry.attachments.splice($scope.selectedEntry.attachments.indexOf(item), 1);
		    }
		}
		
    
    	globalNav.registerEditController(globalNav.ACTION_JOURNAL_ENTRY, $scope.initAction);
    	
    	$scope.initAction();
    	
	    
    }
}());