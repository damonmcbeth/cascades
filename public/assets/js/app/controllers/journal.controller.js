(function() {
    'use strict';

    angular
        .module('app')
        .controller('JournalController', JournalController);

    JournalController.$inject = ['$scope', '$state', '$stateParams', '$window', '$filter', '$sce', 'globalSettings', 'journalService'];

    function JournalController($scope, $state, $stateParams, $window, $filter, $sce, globalSettings, journalService) {
        $scope.$state = $state;
        $scope.display = $stateParams.display;
        $scope.gs = globalSettings;
        
        $scope.org = "";
        $scope.memoAliasPlural = "";
        $scope.itemLabel = "";
        
        $scope.grouping = [];
        $scope.orderByFld = 'updated';
        
		$scope.search = '';
		
		$scope.readFlag = '';
        
        
        globalSettings.initSettings().then(
			function() {
				$scope.memoAliasPlural = globalSettings.currWorkspace.Terminology.memoAliasPlural;
				$scope.org = globalSettings.currWorkspace.Terminology;

				$scope.readFlag = "READ_" + globalSettings.currProfile.person;
				
				if ($scope.display == "Ideas") {
					$scope.itemLabel = "Idea";
				} else {
					$scope.itemLabel = globalSettings.currWorkspace.Terminology.memoAlias;
				}
				
				journalService.getAllEntries().then(
					function(journal) {						
						journalService.buildSinceGrouping().then(
							function(grouping) {
								$scope.grouping = journalService.sinceGrouping;
								$scope.journal = journal;
							}
						);
						
				});
			}
		)
		
		$scope.hasGroup = function(grp, search) {
	        if ($scope.journal == null || $scope.journal.length == 0) {
		        return false;
	        } else {
	        	var cnt = ($filter('filter')($scope.journal, $scope.getFilter(grp, search))).length;
	        	return cnt > 0;
	        }
        }
                
        $scope.getFilter = function(grp, search) {
		    var owner = globalSettings.currProfile.person;
		    var filter;
		    
	        if ($scope.display == "My") {
				filter = {targetId: globalSettings.currProfile.person, $:search, since:grp};
			} else if ($scope.display == "Archived") {
				filter = {archived: true, $:search, since:grp};
			} else if ($scope.display == "Ideas") {
				filter = {type: "Idea", $:search, since:grp};
			} else {
				filter = {archived: false, $:search, since:grp};
			}
			
			return filter;
    	}

		
		$scope.formatContent = function(content) {
			return $sce.trustAsHtml(content);
		}
			
		$scope.openEntryDetails = function(entry) {
            $scope.nav.openJournalEditDetails(entry.$id);
        }
        
        $scope.newEntry = function() {
            $scope.nav.newJournalEntry();
        }
		
		$scope.determineDuration = function(entry) {
			var start = moment(entry.start);
			var end = moment(entry.end);

			return end.from(start, true);
		}

        $scope.determineContentHeight = function(entry) {
	        var result = "100%";
	        
	        var images = 0;
	        var files = 0;
	        
	        if (entry.attachments != null) {
	        	images = ($filter('filter')(entry.attachments, 'image/')).length;
	        	files = ($filter('filter')(entry.attachments, '!image/')).length;
	        }
	        
	        if (entry.content == null || entry.content == "") {
		        result = "30px";
	        } else if (images > 0 || files > 0) {
		        var tmp = 320;
		        
		        if (images == 1) {
			        tmp = tmp - 180;
		        } else if (images > 1) {
			        tmp = tmp - 215;
		        } 
		        
		        if (files > 0) {
			        tmp = tmp - 30;
		        }
		        
		        result = tmp + "px";
	        }
	        
	        return result;
        }
        
    }
}());