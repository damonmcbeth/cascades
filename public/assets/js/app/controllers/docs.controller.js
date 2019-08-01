(function() {
    'use strict';

    angular
        .module('app')
        .controller('DocsController', DocsController);

    DocsController.$inject = ['$scope', '$rootScope', '$state', '$mdDialog', '$filter', 'globalSettings', 
    	'globalNav', 'taskService', 'docService', 'journalService'];

    function DocsController($scope, $rootScope, $state, $mdDialog, $filter, globalSettings, 
    						globalNav, taskService, docService, journalService) {
	
		$scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
		$scope.search = '';
		
		var tmpDocs = [];
		var tmpFolders = [];
		$scope.docs = [];
		$scope.folders = [];

		$scope.selectedFolder = "Folder";

		$scope.folderList;
		$scope.cntHack = 1;

		$scope.addFld = function(title, id, restricted) {
			var tmpDoc = {};
			tmpDoc.folder = "Folder";
			tmpDoc.$id = id;
			tmpDoc.title = title;
			tmpDoc.type = restricted ? "Folder-Locked" : "Folder";
			tmpDoc.url = "";
			tmpDoc.restricted = restricted;

			tmpFolders.push(tmpDoc);
			if (id != "Folder") {
				tmpDocs.push(tmpDoc);
			}
			
		}

		$scope.addDoc = function(folder, attachment, updated, src) {
			var tmpDoc = {};
			tmpDoc.folder = folder;
			tmpDoc.title = attachment.title;
			tmpDoc.labels = attachment.labels;
			tmpDoc.type = attachment.type;
			tmpDoc.url = attachment.url;
			tmpDoc.updated = updated;
			tmpDoc.src = src;

			tmpDocs.push(tmpDoc);
		}

		$scope.populateFolders = function() {
			

			docService.getAllFolders().then(
				function(entries) {
					$scope.folderList = entries;
					
					$scope.folderList.$watch(function(event) {
						//console.log(event);
						$scope.buildFolders();
					});

					$scope.buildFolders();
					
			});

		}

		$scope.buildFolders = function() {
			if ($scope.folderList != null) {
				tmpDocs = [];
				tmpFolders = [];
				//tmpFolders.push("Folder");
				$scope.addFld("Folder", "Folder", true);

				var len = $scope.folderList.length;
						
				for (var i=0; i<len; i++) {
					$scope.addFld($scope.folderList[i].title, $scope.folderList[i].$id, false);
					//tmpFolders.push($scope.folderList[i].title);
				}

				$scope.populateTasks();
			}
		}

        $scope.populateTasks = function() {
	        taskService.getAllTasks().then(
				function(tasks) {
					var owner = globalSettings.currProfile.person;
					var entries = $filter('filter')(tasks, {$:owner, archived: '!'});
					var len = entries.length;
					var attachments;
					var found = false;
					var folder = globalSettings.currWorkspace.Terminology.taskAliasPlural;

					for (var i=0; i<len; i++) {
						attachments = entries[i].attachments;
						if (attachments != null) {
							found = true;
							var len2 = attachments.length;
							//console.log(attachments);

							for (var j=0; j<len2; j++) {
								$scope.addDoc(folder, attachments[j], entries[i].updated, entries[i].title);
							}
						}
					}

					if (found) {
						//tmpFolders.push(folder);
						$scope.addFld(folder, folder, true);
					}

					$scope.populateJournal();
			});
		}

		$scope.populateJournal = function() {
			journalService.getAllEntries().then(
				function(journal) {	
					var entries = $filter('filter')(journal, {archived: false});
					var len = entries.length;
					var attachments;
					var found = false;
					var folder = globalSettings.currWorkspace.Terminology.memoAliasPlural;

					for (var i=0; i<len; i++) {
						attachments = entries[i].attachments;
						if (attachments != null) {
							found = true;
							var len2 = attachments.length;

							for (var j=0; j<len2; j++) {
								$scope.addDoc(folder, attachments[j], entries[i].updated, entries[i].title);
							}
						}
					}

					if (found) {
						//tmpFolders.push(folder);
						$scope.addFld(folder, folder, true);
					}

					$scope.populateDocs();
			});
		}

		$scope.populateDocs = function() {
			$scope.folders = tmpFolders;
			$scope.docs = tmpDocs;
		}

		$scope.openDoc = function(doc, ev) {

			if (doc.type == "Folder" || doc.type == "Folder-Locked") {
				$scope.selectedFolder = doc.$id;
			} else if (doc.type.startsWith("image")) {
				$scope.showEntry(doc, ev);
			} else {
				window.open(doc.url, '_blank');
			}
			
		}

		$scope.getFilter = function(folder) {
			if ($scope.search == null || $scope.search == "") {
				return {folder: folder};
			} else {
				return {folder: folder, $: $scope.search};
			}
		}

		$scope.getFolderFilter = function() {
			if ($scope.search == null || $scope.search == "") {
				return {$id: $scope.selectedFolder};
			} else {
				return {$id: ""};
			}
		}

		$scope.hasFolder = function(folder) {
			//console.log("folder:", folder);
			//console.log("$scope.selectedFolder:", $scope.selectedFolder);

	        if ($scope.docs == null || $scope.docs.length == 0) {
				return false;
			} else if ($scope.selectedFolder == folder) {
		        return true;
	        } else {
				var cnt;
				if ($scope.search == null || $scope.search == "") {
					cnt = ($filter('filter')($scope.docs, {folder: $scope.selectedFolder})).length;
				} else {
					cnt = ($filter('filter')($scope.docs, {folder: folder, $: $scope.search})).length;
				}

	        	return cnt > 0;
	        }
		}

		$scope.canAddFile = function() {
			var result = true;
			var len = tmpFolders.length;

			for (var i=0; i<len; i++) {
				if (tmpFolders[i].$id == $scope.selectedFolder) {
					result = !tmpFolders[i].restricted;
					break;
				}
			}

			return result;
		}
		
		$scope.showEntry = function(entry, ev) {
            $mdDialog.show({
              controller: DialogController,
              templateUrl: '/views/partials/docLargeEntryCard.html',
              parent: angular.element(document.body),
              targetEvent: ev,
              clickOutsideToClose: true,
			  locals: { entry: entry,
						calFormats: globalSettings.pref.calFormats },
              fullscreen: true // Only for -xs, -sm breakpoints.
            })
		};
		
		$scope.gotoTopFolder = function() {
			$scope.selectedFolder = "Folder";
		}

		$scope.viewDetails = function(doc) {
			if (doc.type == "Folder" || doc.type == "Folder-Locked") {
				globalNav.openFolderEditDetails(doc.$id);
			}
		}

		$scope.newFolder = function() {
			globalNav.newFolder();
		}

		function DialogController($scope, $mdDialog, entry, calFormats) {
			$scope.entry = entry;
			$scope.calFormats = calFormats;

            $scope.cancel = function() {
              $mdDialog.cancel();
            };
        }
	    
	    globalSettings.initSettings().then(
        	function() {
				tmpDocs = [];
				tmpFolders = [];
	        	$scope.populateFolders();
        });
    }
}());