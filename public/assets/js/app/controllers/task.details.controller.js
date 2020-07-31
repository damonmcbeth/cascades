(function() {
    'use strict';

    angular
        .module('app')
        .controller('TaskDetailsController', TaskDetailsController);

    TaskDetailsController.$inject = ['$scope', '$rootScope', '$state', '$q', '$window', '$timeout', 'globalSettings', 
    	'globalNav', 'taskService', 'projectService', 'peopleService', 'activityService', 'taskActivityService',
    	'tagService', 'storageService'];

    function TaskDetailsController($scope, $rootScope, $state, $q, $window, $timeout, globalSettings, globalNav, taskService, 
    								projectService, peopleService, activityService, taskActivityService,
    								tagService, storageService) {
        $scope.$state = $state;
        $scope.gs = globalSettings;
		$scope.ac = activityService;
		$scope.ts = tagService;
        
        $scope.activityLoaded = false;
        $scope.activity = null;
        
        $scope.priorities = taskService.priorities;
	    
	    $scope.isEdit = true;
	    $scope.showHints = false;
	    $scope.projects = [];
	    $scope.people = [];
		$scope.taskStates = [];

		$scope.dueDate;
		$scope.duePicker;

		$scope.newChecklistItem = "";

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
			enableTime: true,
			defaultHour: 17,
			dateFormat: "l M j, Y \\a\\t h:i K",
			disableMobile: true,
			onChange: function(selectedDates, dateStr, instance){
				//console.log("DATE CHANGED");
				if (selectedDates.length == 1) {
					$scope.selectedTask.due = selectedDates[0];
				}
			},
			onReady: function(selectedDates, dateStr, instance){
				$scope.duePicker = instance;
			},
			plugins: [new confirmDatePlugin({})]
		};
		  
		$scope.datePostSetup = function(fpItem) {
			//console.log('flatpickr', fpItem);
			//fpItem.setDate($scope.selectedTask.due, false);
		}

		$scope.showProgress = false;
		var progress = $('#progressBar');

	    $scope.checklistItem;
	    
        $scope.selectedTask = taskService.newTask();
        $scope.selectedTaskSrc = null;
			  
		$scope.openAttachment = function(url){
            $window.open(url, '_blank');
		};
		
		$scope.initEditor = function() {
	        $('#summernote').summernote();
	        $('#summernote').summernote('reset');
	        $('#summernote').summernote('insertText', $scope.selectedTask.notes);
	        
		}
		
		$scope.initDatePicker = function() {
			if ($scope.selectedTask != null && $scope.selectedTask.due != null) {
				//$scope.duePicker.setDate($scope.selectedTask.due, false, "l M j, Y \\a\\t h:i K");
				var newDate = flatpickr.formatDate($scope.selectedTask.due, "l M j, Y \\a\\t h:i K")
				$scope.dueDate = newDate;
				$scope.duePicker.setDate(new Date($scope.selectedTask.due), false, "l M j, Y \\a\\t h:i K");
			}
        }

        $scope.initView = function() {
	        var deferred = $q.defer();
			
			taskService.getTaskStates().then(
				function(list){
					$scope.taskStates = list;

					peopleService.getAllPeople().then(
						function(people) {
							$scope.owners = people;
							
							projectService.getAllProjects().then(
								function(projects) {
									$scope.projects = projects;
									deferred.resolve(true);	
							});
					});
				}
			)

			return deferred.promise;
        }
                        
        $scope.openDetails = function(taskItem) {
	        $scope.closeActivity();
	        
	        $scope.initView().then(
		        function(result) {
			        if (taskItem == null) {
				        $scope.isEdit = false;
				        var tmp = taskService.newTask();
				        
				        var defProj = globalSettings.currPreferences.Settings.Project.defaultProject;
						tmp.projectId = (globalNav.defaultProject == null) ? defProj : globalNav.defaultProject;
						
						if (globalNav.defaultPerson != null)  {
							tmp.relatedId = globalNav.defaultPerson;
						}

						globalNav.clearDefaultProject();
						globalNav.clearDefaultPerson();
				        
				        taskService.initTask(tmp).then(
					        function(initedTask) {
								$scope.selectedTask = initedTask; 
								$scope.initEditor();
								$scope.initDatePicker(); 
						    	$scope.setDefaultFocus();
					        }
				        )
				        
			        } else {
			        	$scope.selectedTaskSrc = taskItem;
			        	taskService.cloneTask(taskItem, null).then(
					        function(clonedTask) {
						        tagService.retrieveTags(taskItem.tags).then(
							        function(tags) {
								        clonedTask.tags = tags;
										$scope.selectedTask = clonedTask;
										$scope.initEditor(); 
										$scope.initDatePicker();
								        $scope.setDefaultFocus();
							    });   	  
					    });
			        }
			        
			        
		    });
        }
        
        $scope.setDefaultFocus = function() {
	        $timeout(function() {
        		var element = $window.document.getElementById('taskTitle');
				if (element)
					element.focus();
			});
      	}
        
        $scope.saveTask = function(isValid) {
	        if (isValid) {
	        	$scope.cleanUpForSave();
	        	taskActivityService.saveTask($scope.selectedTask, $scope.selectedTaskSrc, true);
	        	$scope.closeDetails();
	        } else {
		        globalSettings.showErrorToast("Please correct errors before saving.");
		        $scope.showHints = true;
	        }
        }
        
        $scope.cleanUpForSave = function() {
	        if ($scope.selectedTask.delegate == "") {
		        $scope.selectedTask.delegate = null;
	        }
			
			$scope.selectedTask.relatedId = ($scope.selectedTask.related == null) ? null : $scope.selectedTask.related.$id;
	        $scope.selectedTask.ownerId = ($scope.selectedTask.owner == null) ? null : $scope.selectedTask.owner.$id;
	        $scope.selectedTask.delegateId = ($scope.selectedTask.delegate == null) ? null : $scope.selectedTask.delegate.$id;
	        
	        if ($scope.selectedTask.project == null || $scope.selectedTask.project == "") {
		        $scope.selectedTask.project = null;
		        $scope.selectedTask.projectId = null;
	        } else {
		        $scope.selectedTask.projectId = $scope.selectedTask.project.$id;
	        }
        }
        
        $scope.cancelEdit = function() {
	        $scope.closeDetails();
        }
        
        $scope.deleteTask = function() {
	        taskActivityService.deleteTask($scope.selectedTaskSrc);
	        $scope.closeDetails();
        }
        
        $scope.closeDetails = function() {
	        $scope.closeActivity();
	        $scope.selectedTaskSrc = null;
		    globalNav.hideSideEditForm();
        }
        
    	$scope.initAction = function() {
	    	if (globalNav.action == globalNav.ACTION_TASK_OPEN_DETAILS
	    		&& globalNav.actionArg != null) {
		    		
		    	taskService.findTask(globalNav.actionArg).then(
		    		function(task) {
		    			$scope.openDetails(task);
		    	});
	    	} else if (globalNav.action == globalNav.ACTION_TASK_NEW) {
		    	$scope.openDetails(null);
	    	} 
	    	
	    	globalNav.clearAction();
    	}
    	
    	$scope.openActivity = function() {
	    	if (!$scope.activityLoaded) {
		    	activityService.getRecentActivity().then(
					function(act) {
						$scope.activity = act;
				    	$scope.activityLoaded = true;
				});
	    	}
    	}
    	
    	$scope.closeActivity = function() {
	    	$scope.activityLoaded = false;
    	}
    	
    	$scope.addChecklistItem = function() {
			
			if ($scope.newChecklistItem != null && $scope.newChecklistItem != "") {
				var tmp = {
							isDone: false,
							title: $scope.newChecklistItem
						};
				
				$scope.selectedTask.checklist.push(tmp);
				var itemIndex = $scope.selectedTask.checklist.length - 1;
				
				$scope.itemIndex = itemIndex;
				$scope.newChecklistItem = "";
			}
    	}
    	
    	$scope.checkIfNewCheckListItem = function(itemIndex) {
	    	/* if ($scope.itemIndex != null) {
		    	var comp = document.getElementById('checklistItem_' + itemIndex);
		    	comp.focus();
		    	comp.select();
		    	
		    	$scope.itemIndex = null;
	    	} */
    	}
    	
    	$scope.removeChecklistItem = function(item) {
	    	if (item != null) {
		    	$scope.selectedTask.checklist.splice($scope.selectedTask.checklist.indexOf(item), 1);
		    }
    	}
    	
    	$scope.clearDueDate = function() {
			$scope.selectedTask.due = null;
			$scope.dueDate = null;
		}
		
		$scope.clearDelegate = function() {
			$scope.selectedTask.delegate = null;
			$scope.delegateSearchText = null;
		}
		
		$scope.clearOwner = function() {
			$scope.selectedTask.owner = null;
			$scope.ownerSearchText = null;
		}
		
		$scope.clearRelated = function() {
			$scope.selectedTask.related = null;
			$scope.relatedSearchText = null;
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
						
						$scope.selectedTask.attachments.push(attachment);
				})
			}
    	}
    	
    	$scope.removeAttachment = function(item) {
	    	if (item != null) {
		    	$scope.selectedTask.attachments.splice($scope.selectedTask.attachments.indexOf(item), 1);
		    }
		}
    
    	globalNav.registerEditController(globalNav.ACTION_TASK, $scope.initAction);
    	
    	$scope.initAction();
    }
}());