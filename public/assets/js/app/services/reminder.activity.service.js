 (function() {
    'use strict';

    var app = angular.module('app');
    		
	app.factory('reminderActivityService', ['$q', '$filter', 'activityService', 'reminderService', 'globalSettings', 
		function($q, $filter, activityService, reminderService, globalSettings) {
		
		function JournalActivityService() {
			var self = this;
		
			//Methods
			self.save = function (edited, orig) {
				var deferred = $q.defer();
				
				reminderService.cloneEntry(orig).then(
					function(origClone) {
						reminderService.saveEntry(edited, orig).then(
							function(result) {
								//self.captureUpdateActivity(edited, origClone);
								globalSettings.showSuccessToast(globalSettings.currWorkspace.Terminology.memoAlias + ' saved.');
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
					activityService.addActivity(activityService.TYPE_CREATE, edited, edited.$id, activityService.TAR_TYPE_PERSON, edited);
					
		    	} else {
			    	
			    	//Handle name
				    if (edited.name != orig.name) {
						activityService.addActivity(activityService.TYPE_UPDATE, orig, orig.$id, 
													activityService.TAR_TYPE_PERSON, edited, null, "name",
													edited.name,
													orig.name);
			    	}
			    	
			    	//Handle title
				    if (edited.title != orig.title) {
						activityService.addActivity(activityService.TYPE_UPDATE, orig, orig.$id, 
													activityService.TAR_TYPE_PERSON, edited, null, "title",
													edited.title,
													orig.title);
			    	}
			    	
			    	//Handle email
				    if (edited.primaryEmail != orig.primaryEmail) {
						activityService.addActivity(activityService.TYPE_EMAIL, orig, orig.$id, 
													activityService.TAR_TYPE_PERSON, edited, null, "email",
													edited.typeName,
													orig.typeName);
			    	}
			    	
			    	//Handle primaryPhone
				    if (edited.primaryPhone != orig.primaryPhone) {
						activityService.addActivity(activityService.TYPE_UPDATE_PHONE, orig, orig.$id, 
													activityService.TAR_TYPE_PERSON, edited, null, "Primary phone",
													$filter('tel')(edited.primaryPhone),
													$filter('tel')(orig.primaryPhone));
			    	}
			    	
			    	//Handle secondaryPhone
				    if (edited.secondaryPhone != orig.secondaryPhone) {
						activityService.addActivity(activityService.TYPE_UPDATE_PHONE, orig, orig.$id, 
													activityService.TAR_TYPE_PERSON, edited, null, "Secondary phone",
													$filter('tel')(edited.secondaryPhone),
													$filter('tel')(orig.secondaryPhone));
			    	}
			    	
			    	//Handle avatar
				    if (edited.avatar != orig.avatar) {
						activityService.addActivity(activityService.TYPE_UPDATE, orig, orig.$id, 
													activityService.TAR_TYPE_PERSON, edited, null, "Avatar");
			    	}
			    	
			    	//Handle notes
				    if (edited.notes != orig.notes) {
						activityService.addActivity(activityService.TYPE_UPDATE_NOTES, orig, orig.$id, 
													activityService.TAR_TYPE_PERSON, edited, null, "notes");
			    	}
		    	}
		    }
		    
		    self.captureStatusUpdateActivity = function(task, status) {
			    
		    }	    
		}
		
		return new JournalActivityService();
	}]);

}());