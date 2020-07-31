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
		
		$scope.startDate;
		$scope.startPicker;

		$scope.endDate;
		$scope.endPicker;
		$scope.commentTitle;

		$scope.dateOpts = {
			enableTime: true,
			dateFormat: "l M j, Y \\a\\t h:i K",
			defaultHour: 9,
			disableMobile: true,
			onChange: function(selectedDates, dateStr, instance){
				//console.log("DATE CHANGED");
				if (selectedDates.length == 1) {
					$scope.selectedEntry.start = selectedDates[0];
				}
			},
			onReady: function(selectedDates, dateStr, instance){
				$scope.startPicker = instance;
			},
			plugins: [new confirmDatePlugin({})]
		};

		$scope.dateEndOpts = {
			enableTime: true,
			dateFormat: "l M j, Y \\a\\t h:i K",
			defaultHour: 17,
			disableMobile: true,
			onChange: function(selectedDates, dateStr, instance){
				//console.log("DATE CHANGED");
				if (selectedDates.length == 1) {
					$scope.selectedEntry.end = selectedDates[0];
				}
			},
			onReady: function(selectedDates, dateStr, instance){
				$scope.endPicker = instance;
			},
			enable: [
				function(date) {
					if ($scope.selectedEntrySrc != null && $scope.selectedEntrySrc.start != null) {
						return (date > new Date($scope.selectedEntrySrc.start));
					} else {
						return true;
					}
					
				}
			],
			plugins: [new confirmDatePlugin({})]
		};
		  
		$scope.datePostSetup = function(fpItem) {
			//console.log('flatpickr', fpItem);
			//fpItem.setDate($scope.selectedTask.due, false);
		}

        $scope.content = "";
	    $scope.options = {
		    height: 200,
		    airMode: false,
		    toolbar: [
				['para', ['style']],
				['fontname', ['fontname']],
				['color', ['color']],
				['fontsize', ['fontsize']],
				['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
				['alignment', ['ul', 'ol', 'paragraph']],
				['insert', ['link', 'table', 'hr']],
				['misc', ['undo']],
				['view', ['fullscreen', 'codeview']],
				['help', ['help']]
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
										$scope.initDatePicker();
								        $scope.setDefaultFocus();
								        journalService.markAsRead(entry.$id);
								        
								        //actType, tar, tarId, tarType, pers, proj, detail1, detail2
										activityService.addAccessActivity(activityService.TYPE_ACCESS, entry, entry.$id, activityService.TAR_TYPE_JOURNAL, null, null);   	
							    });   	  
					    });
		
			        }
			});
		}
		
		$scope.initDatePicker = function() {
			if ($scope.selectedEntrySrc != null && $scope.selectedEntrySrc.start != null) {
				var newDate = flatpickr.formatDate(new Date($scope.selectedEntrySrc.start), "l M j, Y \\a\\t h:i K")
				$scope.startDate = newDate;
				$scope.startPicker.setDate(new Date($scope.selectedEntrySrc.start), false, "l M j, Y \\a\\t h:i K");
			}

			if ($scope.selectedEntrySrc != null && $scope.selectedEntrySrc.end != null) {
				var newEDate = flatpickr.formatDate(new Date($scope.selectedEntrySrc.end), "l M j, Y \\a\\t h:i K")
				$scope.endDate = newEDate;
				$scope.endPicker.setDate(new Date($scope.selectedEntrySrc.end), false, "l M j, Y \\a\\t h:i K");
			}
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
			
			if ($scope.selectedEntrySrc.content == null || $scope.selectedEntrySrc.content == "") {
				$scope.options.height = 200;
			} else {
				$scope.options.height = 400;
			}
        }
        
        $scope.cleanUpForSave = function() {
	        if ($scope.selectedEntry.target == null || $scope.selectedEntry.target == "") {
		        $scope.selectedEntry.targetName = null;
		        $scope.selectedEntry.targetId = null;
	        } else {
	        	$scope.selectedEntry.targetName = $scope.selectedEntry.target.first + " " + $scope.selectedEntry.target.last;
	        	$scope.selectedEntry.targetId = ($scope.selectedEntry.target == null) ? null : $scope.selectedEntry.target.$id;
	        }
	        
	        if ($scope.selectedEntry.project == null || $scope.selectedEntry.project == "") {
		        $scope.selectedEntry.project = null;
		        $scope.selectedEntry.projectId = null;
	        } else {
		        $scope.selectedEntry.projectId = $scope.selectedEntry.project.$id;
			}
			
			if ($scope.selectedEntry.url != null && $scope.selectedEntry.url != "") {
				var pattern = /^((http|https|ftp):\/\/)/;

				if(!pattern.test($scope.selectedEntry.url)) {
					$scope.selectedEntry.url = "http://" + $scope.selectedEntry.url;
				}
			} else {
				$scope.selectedEntry.url = null;
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
			$scope.startDate = null;
			$scope.clearEndDate();
		}
		
		$scope.clearEndDate = function() {
			$scope.selectedEntry.end = null;
			$scope.endDate = null;
    	}
    	
    	$scope.onfileUploadChange = function onChange(loc, fileList, uploadCtrl) {
			var file = fileList[0];
			
			if (file != null) {
				progress.removeClass('ng-hide');
				
				storageService.uploadFile(loc, file).then(
					function(downloadURL) {
						progress.addClass('ng-hide');
						
						var attachment = {
							title: file.name,
							type: file.type,
							url: downloadURL
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

		$scope.clearTarget = function() {
			$scope.selectedEntry.target = null;
			$scope.ownerSearchText = null;
    	}
		
		$scope.addComment = function() {
			if ($scope.commentTitle == null || $scope.commentTitle == "") {
				return;
			}

	    	var tmp = {
						created: new Date(),		    			
		    			title: $scope.commentTitle,
						createdName: globalSettings.currProfile.name,
						createdBy: globalSettings.currProfile.person,
						canDelete: true
	    			};
	    	
			$scope.selectedEntry.comments.push(tmp);
			$scope.commentTitle = "";
	    	
    	}
    	
    	$scope.removeComment = function(item) {
	    	if (item != null) {
		    	$scope.selectedEntry.comments.splice($scope.selectedEntry.comments.indexOf(item), 1);
		    }
    	}


    
    	globalNav.registerEditController(globalNav.ACTION_JOURNAL_ENTRY, $scope.initAction);
    	
    	$scope.initAction();
    	
	    
    }
}());