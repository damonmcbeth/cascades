 (function() {
    'use strict';

    var app = angular.module('app');
    		
	app.factory('projectActivityService', ['$q', '$filter', 'activityService', 'projectService', 'globalSettings', function($q, $filter, activityService, projectService, globalSettings) {
		
		function ProjectActivityService() {
			var self = this;
		
			//Methods
			self.save = function (edited, orig) {
				var deferred = $q.defer();
				
				projectService.cloneProject(orig).then(
					function(origClone) {
						projectService.saveProject(edited, orig).then(
							function(result) {
								self.captureUpdateActivity(edited, origClone);
								globalSettings.showSuccessToast(globalSettings.currWorkspace.Terminology.projectAlias + ' saved.');
								deferred.resolve(true);	
							}
						);
					}
				);
				
				return deferred.promise;
			}
			
		    self.captureUpdateActivity = function(edited, orig) {
			    
			    //Handle new
			    if (orig == null) {
				    
					activityService.addActivity(activityService.TYPE_CREATE, edited, edited.$id, activityService.TAR_TYPE_PROJECT, null, edited);
					
			    	
			    	//Handle close
				    if (edited.status == 'Done')  {
						activityService.addActivity(activityService.TYPE_DONE, edited, edited.$id, activityService.TAR_TYPE_PROJECT, null, edited);
			    	}
					
		    	} else {
			    	//Handle reopen
				    if (edited.status != 'Done' &&  orig.status == 'Done') {
						activityService.addActivity(activityService.TYPE_REOPEN, orig, orig.$id, activityService.TAR_TYPE_PROJECT, null, edited);
			    	}
			    	
			    	//Handle title
				    if (edited.title != orig.title) {
						activityService.addActivity(activityService.TYPE_UPDATE, orig, orig.$id, 
													activityService.TAR_TYPE_PROJECT, null, edited, "title",
													edited.title,
													orig.title);
			    	}
			    	
			    	//Handle type
				    if (edited.typeName != orig.typeName) {
						activityService.addActivity(activityService.TYPE_UPDATE, orig, orig.$id, 
													activityService.TAR_TYPE_PROJECT, null, edited, "type",
													edited.typeName,
													orig.typeName);
			    	}
			    	
			    	//Handle revenue
				    if (edited.revenue != orig.revenue) {
						activityService.addActivity(activityService.TYPE_UPDATE_MONEY, orig, orig.$id, 
													activityService.TAR_TYPE_PROJECT, null, edited, "revenue",
													$filter('currency')(edited.revenue, '$'),
													$filter('currency')(orig.revenue, '$'));
			    	}
			    	
			    	//Handle revenue
				    if (edited.notes != orig.notes) {
						activityService.addActivity(activityService.TYPE_UPDATE_NOTES, orig, orig.$id, 
													activityService.TAR_TYPE_PROJECT, null, edited, "notes",
													edited.notes, orig.notes);
			    	}
			    	
			    	//Handle assign
				    if (edited.owner != orig.owner) {
						activityService.addActivity(activityService.TYPE_OWNER_CHANGE, orig, orig.$id, activityService.TAR_TYPE_PROJECT, edited.owner, edited);
			    	}
			    	
			    	//Handle update start date			    	
			    	var editedStart = (edited.start == null) ? null : edited.start.getTime();
				    var origStart = (orig.start == null) ? null : orig.start.getTime();
				    if (editedStart != origStart) {
						activityService.addActivity(activityService.TYPE_UPDATE_DATE, orig, orig.$id, 
													activityService.TAR_TYPE_PROJECT, null, edited, "start date", 
													$filter('date')(editedStart, 'medium'), $filter('date')(origStart, 'medium'));
			    	}
			    	
			    	//Handle update due date			    	
			    	var editedEnd = (edited.end == null) ? null : edited.end.getTime();
				    var origEnd = (orig.end == null) ? null : orig.end.getTime();
				    if (editedEnd != origEnd) {
						activityService.addActivity(activityService.TYPE_UPDATE_DATE, orig, orig.$id, 
													activityService.TAR_TYPE_PROJECT, null, edited, "due date", 
													$filter('date')(editedEnd, 'medium'), $filter('date')(origEnd, 'medium'));
			    	}
			    	
			    	//Handle close
				    if (edited.status == 'Done' &&  orig.status != 'Done')  {
						activityService.addActivity(activityService.TYPE_DONE, orig, orig.$id, activityService.TAR_TYPE_PROJECT, null, edited);
			    	}

		    	}
		    	
			    
		    }
		    
		    self.captureStatusUpdateActivity = function(task, status) {
			    
		    }
		    		    
		}
		
		return new ProjectActivityService();
	}]);

}());