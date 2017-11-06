(function() {
    'use strict';

    angular
        .module('app')
        .controller('ReminderEditController', ReminderEditController);

    ReminderEditController.$inject = ['$scope', '$window', '$rootScope', '$state', '$q', 'globalSettings', 'tagService',
    										'$timeout', 'globalNav', 'reminderService', 'peopleService', 'reminderActivityService',
    										'storageService'];

    function ReminderEditController($scope, $window, $rootScope, $state, $q, globalSettings, tagService,
    									$timeout, globalNav, reminderService, peopleService, reminderActivityService,
    									storageService) {
        $scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
        
        $scope.isEdit = true;
		$scope.showHints = false;
		
		$scope.calendarInit = false;
        
        $scope.dateFormat = "ddd, MMMM D, YYYY,  h:mma";
        
        $scope.content = "";
	    $scope.everyCount  = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];
		
		$scope.showProgress = false;
		var progress = $('#progressBar');
		  
		$scope.initView = function() {
	        var deferred = $q.defer();
			
			peopleService.getAllPeople().then(
				function(people) {
					$scope.owners = people;
					deferred.resolve(true);
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
        
        $scope.selectedEntry = reminderService.newEntry();
        $scope.selectedEntrySrc = null;
          
        $scope.openDetails = function(entry) {
	        $scope.initView().then(
		        function(result) { 
			        if (entry == null) {
				        $scope.isEdit = false;
				        var tmp = reminderService.newEntry();
				        
				        reminderService.initEntry(tmp).then(
					        function(initedEntry) {
						    	$scope.selectedEntry = initedEntry;
								$scope.setDefaultFocus();
								$scope.refreshCalendar();
					        }
				        )
				        
			        } else {
				        $scope.selectedEntrySrc = entry;
			        	reminderService.cloneEntry(entry, null).then(
					        function(clonedEntry) {
						        tagService.retrieveTags(entry.tags).then(
							        function(tags) {
								        clonedEntry.tags = tags;
								        $scope.selectedEntry = clonedEntry;
										$scope.setDefaultFocus();
										$scope.refreshCalendar();
							    });   	  
					    });
		
			        }
			});
        }
        
        $scope.setDefaultFocus = function() {
	        $timeout(function() {
        		var element = $window.document.getElementById('entryTitle');
				if (element) {
					element.focus();
				}
			});
      	}
        
        $scope.cleanUpForSave = function() {
	        //$scope.selectedEntry.name = $scope.selectedPerson.first + " " + $scope.selectedPerson.last;
	        $scope.selectedEntry.targetId = ($scope.selectedEntry.target == null) ? null : $scope.selectedEntry.target.$id;
	        
        }
        
        $scope.saveEntry = function(isValid) {
	        if (isValid) {
		        $scope.cleanUpForSave();
				reminderActivityService.save($scope.selectedEntry, $scope.selectedEntrySrc).then(
					function(result) {
						if ($scope.isEdit) {
							//insightsService.calProjectSummary($scope.selectedPerson.$id);
						}
					}
				);
		        $scope.closeDetails();
		    } else {
			    $scope.showHints = true;
			    globalSettings.showErrorToast("Please correct errors before saving.");

		    }
        }
        
        $scope.initAction = function() {
	    	if (globalNav.action == globalNav.ACTION_REMINDER_EDIT
	    		&& globalNav.actionArg != null) {
		    		
		    	reminderService.findEntry(globalNav.actionArg).then(
		    		function(entry) {
						$scope.openDetails(entry);
						
		    	});
	    	} else if (globalNav.action == globalNav.ACTION_REMINDER_NEW) {
				$scope.openDetails(null);
				
	    	} 
	    	
	    	globalNav.clearAction();
		}
		
		$scope.buildRepeatingEvents = function() {
			var result = [];

			if ($scope.selectedEntry.repeat) {
				var tmpStart = $scope.selectedEntry.start;
				var tmpEnd = $scope.selectedEntry.end;
				
				while(tmpStart <= $scope.selectedEntry.until) {
					result.push($scope.createEvent(tmpStart, tmpEnd));

					tmpStart = moment(tmpStart).add($scope.selectedEntry.everyCount, $scope.selectedEntry.everyInterval).toDate();
					tmpEnd = moment(tmpEnd).add($scope.selectedEntry.everyCount, $scope.selectedEntry.everyInterval).toDate();
				}
			} else {
				result.push($scope.createEvent($scope.selectedEntry.start, $scope.selectedEntry.end));
			}
			
			return result;
		}

		$scope.createEvent = function(start, end) {
			var result = [];
			var adjustedEnd = moment(end).add(1, 'days').toDate();

			result = {
					start: start,
					end: adjustedEnd,
					rendering: 'background',
					allDay: true,
					color: '#007982'
				};
			
			return result;
		}

		$scope.refreshCalendar = function() {
			if (!$scope.calendarInit) {
				$scope.initilizeCalendar();
				$scope.calendarInit = true;
			} else {
				$('#full-calendar-edit').fullCalendar('removeEvents');
				$('#full-calendar-edit').fullCalendar('renderEvents', $scope.buildRepeatingEvents(), true);
			}
		}
		
		$scope.initilizeCalendar = function() {
        	$(document).ready(function() {
			
				var events = $scope.buildRepeatingEvents();

	            $('#full-calendar-edit').fullCalendar({
	                header: {
	                    left: 'title',
						center: '',
						right: 'prev,next'
	                },
	                editable: false,
	                allDayText: "All day",
	                eventLimit: true,
	                businessHours: true,
					navLinks: false,
					timezone: "local",
	                droppable: false,
	                events: events
	            });
	
	            $('.fc-toolbar').find('.fc-button-group').addClass('btn-group');
	            $('.fc-toolbar').find('.fc-button').addClass('btn btn-inverse');
	            $('.fc-toolbar').find('.fc-prev-button').html($('<span />').attr('class', 'fa fa-angle-left'));
	            $('.fc-toolbar').find('.fc-next-button').html($('<span />').attr('class', 'fa fa-angle-right'));
	            
	            $timeout(function () {
			        $('#full-calendar-edit').fullCalendar('render');
			    }, 1000);
			});
    	}


    	$scope.clearStartDate = function() {
	    	$scope.selectedEntry.start = null;
    	}
    	
    	$scope.handleAllDayChanged = function() {
	    	var start = moment($scope.selectedEntry.start);
	    	var end = moment($scope.selectedEntry.end);
	    	
	    	if ($scope.selectedEntry.allday) {
		    	start = start.startOf('day');
		    	end = end.endOf('day');
	    	}
	    	
	    	$scope.selectedEntry.start = start.toDate();
	    	$scope.selectedEntry.end = end.toDate();
    	}
    	
    	$scope.handleStartChanged = function() {
	    	$scope.cleanUpDateRange();
    	}
    	
    	$scope.cleanUpDateRange = function() {
	    	if ($scope.selectedEntry.start.getTime() >= $scope.selectedEntry.end.getTime()) {
		    	var end = moment($scope.selectedEntry.start).add(1, 'hours');
		    	
		    	if ($scope.selectedEntry.allday) {
					end = end.endOf('day');
	    		}
	    		
		    	$scope.selectedEntry.end = end.toDate();
	    	}
    	}
    	
    	$scope.handleEndChanged = function() {
	    	$scope.cleanUpDateRange();
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
    
    	globalNav.registerEditController(globalNav.ACTION_REMINDER, $scope.initAction);
    	
    	$scope.initAction();
    	
	    
    }
}());