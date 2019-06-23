(function() {
    'use strict';

    angular
        .module('app')
        .controller('RemindersController', RemindersController);

    RemindersController.$inject = ['$scope', '$state', '$filter', 'globalSettings', '$timeout', '$q',
    	'globalNav', 'taskService', 'reminderService'];

    function RemindersController($scope, $state, $filter, globalSettings, $timeout, $q,
    						globalNav, taskService, reminderService) {
	    						
        $scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
        
		$scope.entries;
		$scope.reminders;
        $scope.events = [];
        $scope.cntHack = 1;
               
        $scope.populateReminders = function() {
	        reminderService.getAllEntries().then(
		        function(entries) {
					$scope.entries = entries;
					$scope.reminders = entries;
			        $scope.entries.$watch(function(event) {
										console.log(event);
										//if (event.event == "child_added") {
										if ($scope.cntHack == 1) {
											$scope.cntHack++;
											console.log("cntHack: " + $scope.cntHack);
											$scope.buildReminders().then(
												function(result) {
													$('#full-calendar').fullCalendar('removeEvents');
													$('#full-calendar').fullCalendar('renderEvents', $scope.events, true);
											})
										} else {
											$scope.cntHack++;
											console.log("cntHack: " + $scope.cntHack);
											if ($scope.cntHack == 4) {
												$scope.cntHack = 1;
											}
										}
										//}
									});
			        
			        $scope.buildReminders().then(
				        function(result) {
					        $scope.initilizeCalendar();
				        }
			        )
			        
			    }
	        )
	    }
	    
	    
	    $scope.buildReminders = function() {
		    var deferred = $q.defer();

	        var reminders = [];
	        var len = $scope.entries.length;
	        var entry;
	        var icon;
	        var tmp;
	        var notes;
	        
	        for (var i=0; i<len; i++) {
				entry = $scope.entries[i];
				icon = (entry.repeat) ? "<i class='icon pe-7f-refresh-2 m-r-5'></i>" : "";
				notes = (entry.notes == null) ? "" : "<br/><span class='reminder-note'>" + entry.notes + "</span>"
				
				tmp = { title: icon + entry.title + notes,
						start: entry.start,
						end: entry.end,
						allDay: entry.allday,
						type: "Reminder",
						$id: entry.$id,	
						borderColor: '#007982',
						backgroundColor: '#caeaec'
				};	
				
				reminders.push(tmp);
			}
			
			$scope.populateTasks(reminders).then(
				function(result) {
					deferred.resolve(true);
			});
			
			return deferred.promise;
		        
	    }
	        
	    $scope.populateTasks = function(reminders) { 
		    var deferred = $q.defer();
		      
	        taskService.getAllTasks().then(
				function(tasks) {
					var len = tasks.length;
					var taskEvents = [];
					var tmp;
					var task;
					
					for (var i=0; i<len; i++) {
						task = tasks[i];
						
						if (task.due != null) {
							//title: '<i class="icon pe-7s-check m-r-5"></i>' + task.title,
							
							tmp = { title: task.title,
									start: task.due,
									type: "Task",
									$id: task.$id,
									backgroundColor: '#ddd' //'#caeaec' 
								};
								
							reminders.push(tmp);
						}
					}
					
					$scope.events = reminders; 
					deferred.resolve(true);
					
			});
			
			return deferred.promise;
			
		}
		
	    globalSettings.initSettings().then(
        	function() {
				$scope.currName = globalSettings.currProfile.name;
	        	$scope.projAliasPlural = globalSettings.currWorkspace.Terminology.projectAliasPlural;
	        	$scope.populateReminders();
        });
        
        //right: 'month,agendaWeek,basicDay'
        $scope.initilizeCalendar = function() {
        	$(document).ready(function() {
	        
	            $('#full-calendar').fullCalendar({
	                header: {
	                    left: 'prev,next today',
	                    center: 'title',
	                    right: 'month,agendaWeek,basicDay'
	                },
	                editable: false,
	                allDayText: "All day",
	                eventLimit: true,
	                businessHours: true,
					navLinks: true,
					timezone: "local",
	                droppable: false,
	                events: $scope.events,
	                eventClick: function(calEvent) {
							if (calEvent.type == "Task") {
								$scope.$apply(function() {
									globalNav.openTaskDetails(calEvent.$id)
								});
							} else if (calEvent.type == "Reminder") {
								$scope.$apply(function() {
									globalNav.openReminderEditDetails(calEvent.$id)
								});
							} else if (calEvent.url) {
								window.open(event.url);
							}
							
							return false;
				    	},
				    eventRender: function (event, element) {
					    	//element.find('.fc-title').append("<br/>" + event.description); 
							element.find('.fc-title').html(event.title);		
					}
	            });
	
	            $('.fc-toolbar').find('.fc-button-group').addClass('btn-group');
	            $('.fc-toolbar').find('.fc-button').addClass('btn btn-inverse');
	            $('.fc-toolbar').find('.fc-prev-button').html($('<span />').attr('class', 'fa fa-angle-left'));
	            $('.fc-toolbar').find('.fc-next-button').html($('<span />').attr('class', 'fa fa-angle-right'));
	            
	            $timeout(function () {
			        $('#full-calendar').fullCalendar('render');
			    }, 1000);
			});
    	}
    	
    	$scope.newEntry = function() {
            $scope.nav.newReminder();
		}
		
		$scope.includeReminder = function(prop) {
		    return function(item) {
				return item[prop] >= moment().add(-10, 'days').toDate();
		    }
		}
        
    }
}());