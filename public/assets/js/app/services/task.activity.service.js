 (function() {
    'use strict';

    var app = angular.module('app');
    		
	app.factory('taskActivityService', ['activityService', 'taskService', '$filter', 'globalSettings', 
		function(activityService, taskService, $filter, globalSettings) {
		
		function TaskActivityService() {
			var self = this;
		
			//Methods
			self.saveTask = function (edited, orig, showToast) {				
				taskService.cloneTask(orig).then(
					function(origClone) {
						taskService.saveTask(edited, orig).then(
							function(result) {
								self.captureTaskUpdateActivity(edited, origClone);
								if (showToast) {
									globalSettings.showSuccessToast(globalSettings.currWorkspace.Terminology.taskAlias + ' saved.');
								}
							}
						);
				});
				
				
			}
			
			self.deleteTask = function (orig) {
				taskService.deleteTask(orig).then(
					function(result) {
						activityService.addActivity(activityService.TYPE_DELETE, orig, orig.$id, activityService.TAR_TYPE_TASK, null, orig.project);
						globalSettings.showSuccessToast(globalSettings.currWorkspace.Terminology.taskAlias + ' deleted.');
					}
				);
			}

			
			self.updateStatus = function(task, isDone) {
				taskService.updateStatus(task, isDone).then(
					function(result) {
						self.captureTaskStatusUpdateActivity(task, isDone);
					}
				);

			}
			
		    self.captureTaskUpdateActivity = function(taskEdited, taskOrig) {
			    var reopen = false;
			    var closeItem = false;
			    
			    
			    //Handle new
			    if (taskOrig == null) {
					activityService.addActivity(activityService.TYPE_CREATE, taskEdited, taskEdited.$id, 
												activityService.TAR_TYPE_TASK, null, taskEdited.project);
												
					if (taskEdited.ownerId != null) {
						activityService.addActivity(activityService.TYPE_OWNER_CHANGE, taskEdited, taskEdited.$id, 
													activityService.TAR_TYPE_TASK, taskEdited.owner, taskEdited.project);
			    	}
		    	}
		    	
			    //Handle reopen
			    if (taskOrig != null && (taskEdited.status != 'Done' &&  taskOrig.status == 'Done')) {
				    reopen = true;
					activityService.addActivity(activityService.TYPE_REOPEN, taskOrig, taskOrig.$id, 
												activityService.TAR_TYPE_TASK, null, taskEdited.project);
		    	} else if (taskOrig != null && (taskEdited.status == 'Done' &&  taskOrig.status != 'Done'))  {
					closeItem = true;
		    	}

		    	
		    	//Handle added to project
			    if (taskOrig != null && (taskEdited.projectId != taskOrig.projectId)) {
				    if (taskOrig.projectId != null) {
					    activityService.addActivity(activityService.TYPE_PROJ_REMOVED, taskOrig, taskOrig.$id, 
					    							activityService.TAR_TYPE_TASK, null, taskOrig.project);
				    }
				    
				    if (taskOrig.projectId == null && taskEdited.projectId != null || taskOrig.projectId != null && taskEdited.projectId != null) {
						activityService.addActivity(activityService.TYPE_PROJ_ADDED, taskOrig, taskOrig.$id, 
													activityService.TAR_TYPE_TASK, null, taskEdited.project);
					}
		    	}
			    
			    //Handle assign
			    if (taskOrig != null && (taskEdited.ownerId != taskOrig.ownerId)) {
					activityService.addActivity(activityService.TYPE_OWNER_CHANGE, taskOrig, taskOrig.$id, 
												activityService.TAR_TYPE_TASK, taskEdited.owner, taskEdited.project);
		    	}
			    
			    //Handle delegate
			    if (taskOrig != null && (taskEdited.delegateId != taskOrig.delegateId)) {
					activityService.addActivity(activityService.TYPE_DELEGATE, taskOrig, taskOrig.$id, 
												activityService.TAR_TYPE_TASK, taskEdited.delegate, taskEdited.project);
		    	}
		    	
		    	//Handle priority
			    if (taskOrig != null && (taskEdited.priority != taskOrig.priority)) {
					activityService.addActivity(activityService.TYPE_UPDATE_PRIORITY, taskOrig, taskOrig.$id, 
												activityService.TAR_TYPE_TASK, null, taskEdited.project, "priority",
												taskService.translatePriority(taskEdited.priority),
												taskService.translatePriority(taskOrig.priority));
		    	}
		    	
		    	//Handle status
			    if (taskOrig != null && !reopen && !closeItem && (taskEdited.status != taskOrig.status)) {
					activityService.addActivity(activityService.TYPE_UPDATE_STATE, taskOrig, taskOrig.$id, 
												activityService.TAR_TYPE_TASK, null, taskEdited.project, "status", 
												taskEdited.status, taskOrig.status);
		    	}
		    	
		    	//Handle status
			    if (taskOrig != null &&  (taskEdited.notes != taskOrig.notes)) {
					activityService.addActivity(activityService.TYPE_UPDATE_NOTES, taskOrig, taskOrig.$id, 
												activityService.TAR_TYPE_TASK, null, taskEdited.project, "notes",
												taskEdited.notes, taskOrig.notes);
		    	}
			    
			    //Handle update due date
			    var editedDue = (taskEdited.due == null) ? null : taskEdited.due.getTime();
			    var origDue = (taskOrig == null || taskOrig.due == null) ? null : taskOrig.due.getTime();
			    if (taskOrig != null && (editedDue != origDue)) {
					activityService.addActivity(activityService.TYPE_UPDATE_DATE, taskOrig, taskOrig.$id, 
												activityService.TAR_TYPE_TASK, null, taskEdited.project, "due date", 
												$filter('date')(editedDue, 'medium'), $filter('date')(origDue, 'medium'));
		    	}
			    
			    //Handle close
			    if (closeItem)  {
					activityService.addActivity(activityService.TYPE_DONE, taskOrig, taskOrig.$id, 
												activityService.TAR_TYPE_TASK, null, taskEdited.project);
		    	}
			    
		    }
		    
		    self.captureTaskStatusUpdateActivity = function(task, isDone) {
			    //Handle reopen
			    if (isDone) {
					activityService.addActivity(activityService.TYPE_DONE, task, task.$id, 
												activityService.TAR_TYPE_TASK, null, task.project);
		    	} else {
			    	activityService.addActivity(activityService.TYPE_REOPEN, task, task.$id, 
			    								activityService.TAR_TYPE_TASK, null, task.project);
		    	}
		    }
		    		    
		}
		
		return new TaskActivityService();
	}]);

}());