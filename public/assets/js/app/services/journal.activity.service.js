 (function() {
    'use strict';

    var app = angular.module('app');
    		
	app.factory('journalActivityService', ['$q', '$filter', 'activityService', 'journalService', 'globalSettings', 
		function($q, $filter, activityService, journalService, globalSettings) {
		
		function JournalActivityService() {
			var self = this;
		
			//Methods
			self.save = function (edited, orig) {
				var deferred = $q.defer();
				
				journalService.cloneEntry(orig).then(
					function(origClone) {
						journalService.saveEntry(edited, orig).then(
							function(result) {
								self.captureUpdateActivity(edited, origClone);
								globalSettings.showSuccessToast(globalSettings.currWorkspace.Terminology.memoAlias + ' saved.');
								deferred.resolve(true);	
							}
						);
					}
				);
				
				return deferred.promise;
			}
    		
    		self.archive = function (orig) {
				var deferred = $q.defer();
				
				journalService.cloneEntry(orig).then(
					function(origClone) {
						journalService.archiveEntry(orig.$id).then(
					    	function(result) {
						    	activityService.addActivity(activityService.TYPE_DELETE, orig, orig.$id, activityService.TAR_TYPE_JOURNAL);
								globalSettings.showSuccessToast(globalSettings.currWorkspace.Terminology.memoAlias + " archived");
								deferred.resolve(true);	
					    	}
				    	);
					}
				);
				
				return deferred.promise;
			}
			
			self.restore = function (orig) {
				var deferred = $q.defer();
				
				journalService.cloneEntry(orig).then(
					function(origClone) {
						journalService.restoreEntry(orig.$id).then(
					    	function(result) {
						    	activityService.addActivity(activityService.TYPE_REOPEN, orig, orig.$id, activityService.TAR_TYPE_JOURNAL);
								globalSettings.showSuccessToast(globalSettings.currWorkspace.Terminology.memoAlias + " restored");
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
				    
				    //actType, tar, tarId, tarType, pers, proj, tarFld, tarFldValue, tarFldOldValue
					activityService.addActivity(activityService.TYPE_CREATE, edited, edited.$id, activityService.TAR_TYPE_JOURNAL);
					
		    	} else {
			    	
			    	//Handle title
				    if (edited.title != orig.title) {
						activityService.addActivity(activityService.TYPE_UPDATE, orig, orig.$id, 
													activityService.TAR_TYPE_JOURNAL, null, null, "title",
													edited.title,
													orig.title);
			    	}
			    	
			    	//Handle type
				    if (edited.type != orig.type) {
						activityService.addActivity(activityService.TYPE_UPDATE, orig, orig.$id, 
													activityService.TAR_TYPE_JOURNAL, null, null, "type",
													edited.type,
													orig.type);
			    	}
			    	
			    	//Handle duration
				    if (edited.duration != orig.duration) {
						activityService.addActivity(activityService.TYPE_UPDATE, orig, orig.$id, 
													activityService.TAR_TYPE_JOURNAL, null, null, "duration",
													edited.duration,
													orig.duration);
			    	}
			    	
			    	//Handle target
				    if (edited.targetId != orig.targetId) {
						activityService.addActivity(activityService.TYPE_OWNER_CHANGE, orig, orig.$id, 
													activityService.TAR_TYPE_JOURNAL, edited.target, null, "direct message",
													edited.targetName,
													orig.targetName);
			    	}
			    	
			    	//Handle update start date			    	
			    	var editedStart = (edited.start == null) ? null : edited.start.getTime();
				    var origStart = (orig.start == null) ? null : orig.start.getTime();
				    if (editedStart != origStart) {
						activityService.addActivity(activityService.TYPE_UPDATE_DATE, orig, orig.$id, 
													activityService.TAR_TYPE_JOURNAL, null, null, "date", 
													$filter('date')(editedStart, 'medium'), $filter('date')(origStart, 'medium'));
			    	}
			    	
			    	//Handle notes
				    if (edited.content != orig.content) {
						activityService.addActivity(activityService.TYPE_UPDATE_NOTES, orig, orig.$id, 
													activityService.TAR_TYPE_JOURNAL, null, null, "content",
													edited.content, orig.content);
			    	}
			    	
			    	//Handle added to project
				    if (edited.projectId != orig.projectId) {
					    if (orig.projectId != null) {
						    activityService.addActivity(activityService.TYPE_PROJ_REMOVED, orig, orig.$id, 
						    							activityService.TAR_TYPE_JOURNAL, null, orig.project);
					    }
					    
					    if (orig.projectId == null && edited.projectId != null || orig.projectId != null && edited.projectId != null) {
							activityService.addActivity(activityService.TYPE_PROJ_ADDED, orig, orig.$id, 
														activityService.TAR_TYPE_JOURNAL, null, edited.project);
						}
			    	}
			    	
		    	}
		    }
		    
		    self.captureStatusUpdateActivity = function(task, status) {
			    
		    }	    
		}
		
		return new JournalActivityService();
	}]);

}());