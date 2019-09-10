(function() {
    'use strict';

    angular
        .module('app')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$scope', '$state', '$window', '$q', '$sce', '$filter', 'globalSettings', 'globalNav', 'tagService', 
								'taskService', 'activityService', 'projectService', 'journalService', 'insightsService', 'reminderService',
							'messageService', 'taskActivityService'];

    function DashboardController($scope, $state, $window, $q, $sce, $filter, globalSettings, globalNav, tagService,
							taskService, activityService, projectService, journalService, insightsService, reminderService,
						messageService, taskActivityService) {
        

        $scope.$state = $state;        
        $scope.nav = globalNav;
		$scope.gs = globalSettings;
		$scope.ac = activityService;
		
		$scope.journal = [];
		$scope.articles = [];
		$scope.tasks = [];
		$scope.activity = [];
		$scope.fullActivity = [];
		$scope.grouping = [];
		$scope.allProjects = [];

		$scope.filterTasks = false;
		$scope.filterOverdue = false;
		$scope.filterDueToday = false;
		$scope.filterDueSoon = false;
		$scope.filterDelegated = false;

		$scope.currArticle = "";

		$scope.newTaskDue = "Tomorrow evening";
		$scope.newTaskTitle;
		$scope.newTaskProject;

		$scope.cardOptions = {
            animate:{
                duration:500,
                enabled:true
            },
            barColor:'#009000',
            scaleLength: 0,
            lineWidth: 8,
            lineCap:'square',
            size:90
        };
        
        $scope.summary = {
	        				Journal: { unread: 0 },
	        				Task: { dueToday: 0,
		        					overdue: 0,
		        					dueSoon: 0,
		        					delegated: 0 },
							Project: { open: 0 }
		        		};
        $scope.reminders = null;
        
        $scope.recentPeopleFilter = {targetType: activityService.TAR_TYPE_PERSON};
        $scope.recentProjectFilter = {targetType: activityService.TAR_TYPE_PROJECT};
		$scope.recentNotesFilter = {archived: false};
        
        $scope.hasReminder = false;
		$scope.faq = null;
		$scope.faqPanel = null;
		$scope.showFaq = false;
		
        globalSettings.initSettings().then(
        	function() {
				$scope.taskAliasPural = globalSettings.currWorkspace.Terminology.taskAliasPlural;
				$scope.taskAlias = globalSettings.currWorkspace.Terminology.taskAlias;
				$scope.currName = globalSettings.currProfile.name;

	        	$scope.populateTasks();
				$scope.populateSummary();
				$scope.populateTags();
				$scope.populateReminder();
				$scope.populateActivity();
				$scope.populateJournal();
				$scope.populateArticles();
				$scope.populateFeaturedFAQs();
				$scope.populateProjects();
		});
		
		$scope.populateProjects = function() {
			projectService.getAllProjects().then(
				function(projects) {
					$scope.allProjects = projects;
					$scope.newTaskProject = globalSettings.currPreferences.Settings.Project.defaultProject;

			});	
		}


		$scope.populateFeaturedFAQs = function() {
			globalSettings.getAllFAQs().then(
				function(entries) {
					$scope.showFaq = false;

					var faqs = $filter('filter')(entries, {feature: true});
					var len = faqs.length;
					var indx = (Math.floor((Math.random() * (len + 1)) + 1)) - 1;

					if (indx < len) {
						$scope.showFaq = true;
						$scope.faq = faqs[indx];
					}
			});
        }
        
        $scope.populateTags = function() {
	        tagService.getAllTags().then(
				function(tags) {
					//Do nothing
			});
		}
		
		$scope.populateSummary = function() {
			insightsService.getTaskSummary().then(
				function(summary) {
					$scope.summary = summary;
			});
		}
		
		$scope.populateReminder = function() {
			reminderService.getAllEntries().then(
				function(entries) {
					// $scope.reminders = entries;
					// $scope.hasReminder = $filter("filter")(entries, $scope.includeReminder('start')).length > 0;

					var result = [];
					var today = moment().toDate();
					var lookAhead = moment().add(7, 'days').toDate();

					var len = entries.length;
					var entry;
					var clone;

					

					for (var i=0; i<len; i++) {
						entry = entries[i];

						if (entry.repeat) {
							var tmpStart = entry.start;
							var tmpEnd = entry.end;
							
							while(tmpStart <= entry.until) {
								if ((tmpStart >= today && tmpStart <= lookAhead)
									|| (tmpEnd >= today && tmpEnd <= lookAhead)) {

									clone = reminderService.cloneEntryLite(entry);
									clone.start = tmpStart;
									clone.end = tmpEnd;

									result.push(clone);
									//break;
								}

								tmpStart = moment(tmpStart).add(entry.everyCount, entry.everyInterval).toDate();
								tmpEnd = moment(tmpEnd).add(entry.everyCount, entry.everyInterval).toDate();
							}

						} else {
							if ((entry.start >= today && entry.start <= lookAhead)
								|| (entry.end >= today && entry.end <= lookAhead)) {
								result.push(entry);
							}
						}
					}

					$scope.reminders = result;
			});
		}

		$scope.includeReminder = function(prop) {
		    return function(item) {
		      return item[prop] <= moment().add(10, 'days').toDate();
		    }
		}

		$scope.populateJournal = function() {
			journalService.getAllEntries().then(
				function(entries) {
					$scope.journal = entries;
			});
		}

		$scope.populateArticles = function() {
			globalSettings.getAllArticles().then(
				function(entries) {
					$scope.articles = entries;

					var len = entries.length;
					var indx = (Math.floor((Math.random() * len) + 1)) - 1;

					$scope.currArticle = entries[indx].link;
			});
		}
		
		$scope.includeTask = function() {
		    return function(item) {
				var owner = globalSettings.currProfile.person;

				if (item.isDone) {
					return false;
				}

				if ($scope.filterTasks) {
					if (owner == item.ownerId || owner == item.delegateId) {
						if ($scope.filterDueToday && item.state == 'Due today') {
							return true;
						} else if ($scope.filterOverdue && item.state == 'Overdue') {
							return true;
						} else if ($scope.filterDueSoon && item.state == 'Due soon') {
							return true;
						} else if ($scope.filterDelegated && item.delegateId != null) {
							return true;
						} else {
							return false;
						}
					} else {
						return false;
					}

				} else {
					return !item.isDone && (item.state == 'Overdue' || item.state == 'Due today')
								&& (owner == item.ownerId || owner == item.delegateId);
				}
		    }
		}

		globalSettings.shouldClearCache("insightsSer_TaskSumary")
        
        $scope.hasRecentProjects = function() {
	        return $filter("filter")($scope.activity, $scope.recentProjectFilter, true).length > 0;
		}
		
		$scope.hasRecentPeople = function() {
	        return $filter("filter")($scope.activity, $scope.recentPeopleFilter, true).length > 0;
		}
        
        $scope.populateTasks = function() {
	        taskService.getAllTasks().then(
				function(tasks) {
					$scope.taskSummary = taskService.taskSummary;
					//var owner = globalSettings.currProfile.person;
					//$scope.tasks = $filter('filter')(tasks, {$:owner, isDone: false});
					$scope.tasks = tasks;
					
					activityService.getAccessActivity().then(
				        function(activity) {
					        $scope.activity = activity;

			        });
			});
		}

		$scope.populateActivity = function() {
	        activityService.getRecentActivity().then(
				function(act) {
					var personKey = globalSettings.currProfile.person;
					var filter = {createdBy: personKey};
					
					activityService.determineRecentActivityGrouping(filter).then(
						function(tmpGrouping) {
							$scope.fullActivity = act;
							$scope.grouping = tmpGrouping;
							
					});
			});
		}		

		$scope.openTaskDetails = function(taskItem) {
	        var taskId = (taskItem == null) ? null : taskItem.$id;
	        globalNav.openTaskDetails(taskId);
		}
		
		$scope.updateIsDone = function(item, status) {
	        taskActivityService.updateStatus(item, item.isDone);
		}
		
		$scope.showUnreadFlag = function(item) {
			var readFlag = "READ_" + globalSettings.currProfile.person;

			return item[readFlag] == null || item[readFlag] == undefined;
		}

		$scope.updateDueDate = function(target, task) {
			var value = null;

			switch (target) {
				case 'In 2 hours': value = moment().startOf('hour').add(2, 'hours').toDate(); break; 
				case 'In 4 hours': value = moment().startOf('hour').add(4, 'hours').toDate(); break; 
				case 'This evening': value = moment().startOf('day').add(18, 'hours').toDate(); break;
				case 'Tomorrow morning': value = moment().startOf('day').add(1, 'days').add(8, 'hours').toDate(); break; 
				case 'Tomorrow evening': value = moment().startOf('day').add(1, 'days').add(18, 'hours').toDate();break; 
				case '2 days from now': value = moment().startOf('hour').add(2, 'days').toDate(); break; 
				case 'Next week': value = moment().startOf('hour').add(7, 'days').toDate();
			}

			$scope.updateTask('due', value, task);
		}

		$scope.removeDueDate = function(task) {
			$scope.updateTask('due', null, task);
		}

		$scope.updateTask = function(fld, val, orig) {
			$scope.cloneTask(orig).then(
				function(task) {
					switch (fld) {
						case 'removeTags': task.tags = []; break;
						case 'tag': $scope.addUniqueTag(task, val); break;
						case 'project': $scope.assignProjectToTask(task, val); break;
						case 'owner': $scope.assignOwnerToTask(task, val); break;
						default: task[fld] = val;
					}
					taskActivityService.saveTask(task, orig);
				}
			)
		}

		$scope.cloneTask = function(taskItem) {
			var deferred = $q.defer();

			taskService.cloneTask(taskItem, null).then(
				function(clonedTask) {
					tagService.retrieveTags(taskItem.tags).then(
						function(tags) {
							clonedTask.tags = tags;
							deferred.resolve(clonedTask);	
					});   	  
			});

			return deferred.promise;
		}

		$scope.determineIfTaskFiltered = function() {
			$scope.filterTasks = $scope.filterOverdue || $scope.filterDelegated || $scope.filterDueSoon || $scope.filterDueToday;
		}

		$scope.toggleDueToday = function() {
			$scope.filterDueToday = !$scope.filterDueToday;
			$scope.determineIfTaskFiltered();
		}

		$scope.toggleOverdue = function() {
			$scope.filterOverdue = !$scope.filterOverdue;
			$scope.determineIfTaskFiltered();
		}

		$scope.toggleDueSoon = function() {
			$scope.filterDueSoon = !$scope.filterDueSoon;
			$scope.determineIfTaskFiltered();
		}

		$scope.toggleDelegated = function() {
			$scope.filterDelegated = !$scope.filterDelegated;
			$scope.determineIfTaskFiltered();
		}

		$scope.formatContent = function(content) {
			return $sce.trustAsHtml(content);
		}
		
		$scope.refereshArticle = function() {
			try {
				instgrm.Embeds.process();
			} catch(err) {
				//catchCode - Block of code to handle errors
			} 
		}

		$scope.openFAQ = function() {

            if ($scope.faqPanel != null) {
                $scope.faqPanel.close();
            }

            $scope.faqPanel = jsPanel.create({
                                theme:       'primary',
                                headerTitle: 'Featured Article',
                                headerControls: 'closeonly xs',
                                position:    'right-top -35 100',
                                contentSize: '480 530',
                                content: $scope.populateFAQContent(),
                                onclosed: function(panel){
                                    $scope.faqPanel = null;
                                  }
                            });

		}
		
		$scope.populateFAQContent = function() {
            var tagline = ($scope.faq.tagLine == null) ? "" : $scope.faq.tagLine;
            var img = ($scope.faq.image == null) ? '' : '<div class="m-b-10" style="text-align: center"><image src="' + $scope.faq.image + '" style="width: 90%"></image></div>';

            var content = '<md-content id="faqDetailsContent" class="f-15 b-300 p-15" layout-padding>'
                                + '<div class="b-300 f-20 m-t-5" style="text-transform: uppercase;">'
                                + $scope.faq.title 
                                + '</div>'
                                + '<div class="f-12 b-400">'
                                + tagline
                                + '</div>'
                                + '<md-divider class="m-b-10 m-t-10"></md-divider>'
                                + img
                                + '<div style="min-height:120px">'
                                + $scope.formatContent($scope.faq.content)
                                + '</div>'
                                + '<div class="f-12 text-muted" style="text-align: right">Last updated: '
                                + $filter("amCalendar")($scope.faq.updated, null, globalSettings.pref.calMidFormats)
                                + '</div>'
                                + '<md-divider class="m-t-10"></md-divider>'
                                + '<div class="m-t-15" style="text-align: center">'
                                + '<div>Still can\'t find what you\'re looking for?</div>'
                                + '<div class="m-20">'
                                + '<a href="mailto:info@cascades-pi.com?subject=CASCADES Feedback" '
                                + 'target="_blank" class="btn-primary btn-large">Contact us</a>'
                                + '</div></div>';
            return content;
		}
		
		$scope.addTaskItem = function() {
			if ($scope.newTaskTitle == null || $scope.newTaskTitle == "") {
				return;
			}

			var tmp = taskService.newTask();
			tmp.projectId = $scope.newTaskProject;

			taskService.initTask(tmp).then(
				function(task) {
					task.title = $scope.newTaskTitle;

					var value = null;
					switch ($scope.newTaskDue) {
						case 'In 2 hours': value = moment().startOf('hour').add(2, 'hours').toDate(); break; 
						case 'In 4 hours': value = moment().startOf('hour').add(4, 'hours').toDate(); break; 
						case 'This evening': value = moment().startOf('day').add(18, 'hours').toDate(); break;
						case 'Tomorrow morning': value = moment().startOf('day').add(1, 'days').add(8, 'hours').toDate(); break; 
						case 'Tomorrow evening': value = moment().startOf('day').add(1, 'days').add(18, 'hours').toDate();break; 
						case '2 days from now': value = moment().startOf('hour').add(2, 'days').toDate(); break; 
						case 'Next week': value = moment().startOf('hour').add(7, 'days').toDate(); break
						case 'No due date' : value = null;
					}

					task.due = value;
					taskActivityService.saveTask(task, null, true);
					$scope.newTaskTitle = null;
				}
			);
						
		}


        //$scope.openPersonDetails = function(pid) {
        //    $scope.nav.openPeopleDetails(pid);
        //}
        
        //$scope.openProjectDetails = function(projId) {
        //    $scope.nav.openProjectDetails(projId);
        //}
        
        
    }
}());