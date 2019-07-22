(function() {
    'use strict';

    angular
        .module('app')
        .controller('SettingsController', SettingsController);

    SettingsController.$inject = ['$scope', '$state', '$sce', 'globalSettings', 'globalNav', 'peopleService', 'projectService', '$mdDialog', '$mdSidenav'];

    function SettingsController($scope, $state, $sce, globalSettings, globalNav, peopleService, projectService, $mdDialog, $mdSidenav) {
        $scope.$state = $state;        
        $scope.gs = globalSettings;
        
        $scope.currPerson = {};
        $scope.currPreferences = {};
        $scope.currWorkspace = {};
        $scope.userWorkspaces = {};
        $scope.editableWrkSpc = {};

        $scope.newTaskStatus = null;
        $scope.newProjectType = null;

        $scope.newArticle = null;
        $scope.newArticleTitle = null;

        $scope.selectedTabIndex = 0;

        $scope.faqContent = "";
        $scope.faqTitle = "";
        $scope.faqCategory = "";
        $scope.faqTag = "";
        $scope.faqOrder = 100;

        $scope.faqSearch = null;
        $scope.selectedFaq = null;

        $scope.options = {
		    height: 200,
		    airMode: false,
		    toolbar: [
                ['style', ['bold', 'italic', 'underline', 'clear']],
                ['color', ['color']],
				['alignment', ['ul', 'ol', 'paragraph']],
				['insert', ['link', 'hr']],
				['misc', ['undo']],
	            ['view', ['fullscreen', 'codeview']]
	        ]
        };
        
        $scope.initEditor = function() {
	        $('#summernote').summernote();
	        $('#summernote').summernote('reset');
	        $('#summernote').summernote('insertText', $scope.faqContent);
	        
		}
    
        $scope.defaultGroupings = [{ label: 'Schedule', value: 'Schedule'},
            { label: 'Status', value: 'State'},
            { label: 'Priority', value: 'Priority'}
        ];

        $scope.taskDueSoonOptions = [
            { label: 'In a day', value: 1},
            { label: 'In 3 days', value: 3},
            { label: 'In 5 days', value: 5},
            { label: 'In 10 days', value: 10},
            { label: 'In 30 days', value: 30},
            { label: 'In 60 days', value: 60}
        ];

        $scope.taskStatus = null;
        $scope.taskStatusList = [];
        $scope.taskStatusListSrc = [];
        $scope.projectTypeList = [];
        $scope.projectTypeListSrc = [];
        $scope.articles = [];
        $scope.faqs = [];
        $scope.team = [];

        $scope.showAdmin = false;

        globalSettings.initSettings().then(
	        function() {
                $scope.showAdmin = globalSettings.currProfile.admin == 'Y';

                $scope.initCurrentPerson();
                $scope.initPreferences();
                $scope.initTaskStatusList();
                $scope.initProjectTypeList();
                $scope.populateArticles();
                $scope.populatePeople();
                $scope.populateFAQs();
                $scope.initWorkspace();
                $scope.initEditor();
	        }
        )

        $scope.populatePeople = function() {
            peopleService.getAllPeople().then(
                function(people) {
                    $scope.team = people;
            });
        }

        $scope.populateArticles = function() {
			globalSettings.getAllArticles().then(
				function(entries) {
					$scope.articles = entries;
			});
        }

        $scope.populateFAQs = function() {
			globalSettings.getAllFAQs().then(
				function(entries) {
					$scope.faqs = entries;
			});
        }
        
        $scope.initWorkspace = function() {
            $scope.editableWrkSpc = $scope.currWorkspace;
        }

        $scope.updateTerms = function() {
            $scope.editableWrkSpc.$save();
        }

        $scope.initProjectTypeList = function() {
            projectService.getProjectTypes().then(
                function(types) {
                    $scope.projectTypeListSrc = types;
                    $scope.refreshProjectTypeList();
            });
        }

        $scope.initTaskStatusList = function() {
            globalSettings.retrieveWorkspaceTaskStatus().then(
                function(list) {
                    $scope.taskStatusListSrc = list;
                    $scope.refreshTaskStatusList();
                }
            )
        }

        $scope.initPreferences = function() {
            $scope.currWorkspace = globalSettings.currWorkspace;
            $scope.userWorkspaces = globalSettings.userWorkspaces;
            $scope.currPreferences = globalSettings.currPreferences;
        }

        $scope.initCurrentPerson = function() {
            peopleService.findPerson($scope.gs.currProfile.person).then(
                function(person) {
                    $scope.currPerson = person;
                }
            )
        }

        $scope.updatePerson = function() {
            console.log($scope.currPerson);
            peopleService.getAllPeople().then(
                function(people) {
                    globalSettings.log("settings.controller", "updatePerson", $scope.currPerson);
                    people.$save($scope.currPerson);
                }
            )
        }

        $scope.updateUserPreferences = function() {
           $scope.userWorkspaces.$save($scope.currPreferences).then(
                function(ref) {
                    //console.log(":)");
                }, 
                function(error) {
                    globalSettings.logError("settings.controller", "updateUserPreferences", error);
            });
        }

        $scope.resetPassword = function() {
            console.log("resetPassword");
           //peopleService.resetPassword($scope.currPerson);
        }

        $scope.refreshTaskStatusList = function() {
            $scope.taskStatusList = [];
            $scope.taskStatusList.pushAll($scope.taskStatusListSrc);
        }

        $scope.refreshProjectTypeList = function() {
            $scope.projectTypeList = [];
            $scope.projectTypeList.pushAll($scope.projectTypeListSrc);
        }

        $scope.formatContent = function(content) {
			return $sce.trustAsHtml(content);
        }
        
        $scope.selectedArticle = null;

        $scope.showArticle = function(article, ev) {
            $scope.selectedArticleTitle = article.title;
            $scope.selectedArticleLink = $scope.formatContent(article.link);

            $mdDialog.show({
              controller: DialogController,
              templateUrl: '/partials/article.html',
              parent: angular.element(document.body),
              targetEvent: ev,
              clickOutsideToClose: true,
              locals: { title: article.title,
                        link: $scope.formatContent(article.link) },
              onComplete: $scope.afterShowDialog,
              fullscreen: true // Only for -xs, -sm breakpoints.
            })
        };

        $scope.afterShowDialog = function(scope, element, options) {
            instgrm.Embeds.process()
         }

        $scope.addArticle = function() {
            if ($scope.newArticle != null && $scope.newArticle != ""
                    && $scope.newArticleTitle != null && $scope.newArticleTitle != "") {
                
                var article = {
                    title: $scope.newArticleTitle,
                    link: $scope.newArticle,
                    source: "Instagram"
                };

                globalSettings.updateTimestamp(article);

                var key = firebase.database().ref().child("/Content/Articles").push().key;
                var updates = {};
                updates["/Content/Articles/" + key] = article;
                firebase.database().ref().update(updates);

                $scope.newArticleTitle = "";
                $scope.newArticle = "";
            }
        }

        $scope.removeArticle = function(article) {
            $scope.articles.$remove(article).then(
                function(ref) {
                    globalSettings.log("settings.controller", "removeArticle", "Remove article: " +  article.$id);
                    $scope.refreshProjectTypeList();
                }, 
                function(error) {
                    globalSettings.logError("settings.controller", "removeArticle", error);
                    deferred.resolve(orig);
            });   
        }

        $scope.updateSupportContent = function() {
            globalSettings.updateTimestamp($scope.selectedFaq);
            $scope.faqs.$save($scope.selectedFaq);
        }

        $scope.clearAddSupportContent = function() {
            $scope.faqTitle = "";
            $scope.faqCategory = "";
            $scope.faqTag = "";
            $scope.faqContent = "";
        }

        $scope.openFAQ = function(faq) {
            $scope.selectedFaq = faq;
            $mdSidenav("faqPanel").toggle()

        }

        $scope.addSupportContent = function() {
            if ($scope.faqTitle != null && $scope.faqTitle != ""
                    && $scope.faqCategory != null && $scope.faqCategory != "") {
                
                var article = {
                    title: $scope.faqTitle,
                    category: $scope.faqCategory,
                    tag: $scope.faqTag,
                    content: $scope.faqContent,
                    order: $scope.faqOrder
                };

                globalSettings.updateTimestamp(article);

                var key = firebase.database().ref().child("/Content/Support").push().key;
                var updates = {};
                updates["/Content/Support/" + key] = article;
                firebase.database().ref().update(updates);

            }
        }

        $scope.addProjectType = function() {
            if ($scope.newProjectType != null && $scope.newProjectType != "") {
                var tmp = {
                    revenue: 0,
                    title: $scope.newProjectType,
                    name: $scope.newProjectType
                };
                $scope.newProjectType = "";

                $scope.projectTypeListSrc.$add(tmp).then(
                    function(ref) {
                        globalSettings.log("settings.controller", "addProjectType", "Added project type: " +  ref.key);
                        $scope.refreshProjectTypeList();
                    }, 
                    function(error) {
                        globalSettings.logError("settings.controller", "addProjectType", error);
                        deferred.resolve(orig);
                });   
            }
        }

        $scope.removeProjectType = function(projectType) {
            $scope.projectTypeListSrc.$remove(projectType).then(
                function(ref) {
                    globalSettings.log("settings.controller", "removeProjectType", "Remove project type: " +  projectType.$id);
                    $scope.refreshProjectTypeList();
                }, 
                function(error) {
                    globalSettings.logError("settings.controller", "removeProjectType", error);
                    deferred.resolve(orig);
            });   
        }

        $scope.updateProjectType = function(projectType) {
            $scope.projectTypeListSrc.$save(projectType).then(
                function(ref) {
                    globalSettings.log("settings.controller", "updateProjectType", "Updated project type: " +  projectType.$id);
                }, 
                function(error) {
                    globalSettings.logError("settings.controller", "updateProjectType", error);
                    deferred.resolve(orig);
            });   
        }

        $scope.addTaskStatus = function() {
            if ($scope.newTaskStatus != null && $scope.newTaskStatus != "") {
                var tmp = {
                    editable: true,
                    label: $scope.newTaskStatus,
                    order: 1
                };
                $scope.newTaskStatus = "";

                $scope.taskStatusListSrc.$add(tmp).then(
                    function(ref) {
                        globalSettings.log("settings.controller", "addTaskStatus", "Added task status: " +  ref.key);
                        $scope.refreshTaskStatusList();
                    }, 
                    function(error) {
                        globalSettings.logError("settings.controller", "addTaskStatus", error);
                        deferred.resolve(orig);
                });   
            }
        }

        $scope.removeTaskState = function(taskState) {
            $scope.taskStatusListSrc.$remove(taskState).then(
                function(ref) {
                    globalSettings.log("settings.controller", "removeTaskState", "Remove task status: " +  taskState.$id);
                    $scope.refreshTaskStatusList();
                }, 
                function(error) {
                    globalSettings.logError("settings.controller", "removeTaskState", error);
                    deferred.resolve(orig);
            });   
        }

        $scope.updateTaskState = function(taskState) {
            $scope.taskStatusListSrc.$save(taskState).then(
                function(ref) {
                    globalSettings.log("settings.controller", "updateTaskState", "Updated task status: " +  taskState.$id);
                }, 
                function(error) {
                    globalSettings.logError("settings.controller", "updateTaskState", error);
                    deferred.resolve(orig);
            });   
        }

        $scope.updateOrder = function() {
            var i = 0;
            var len = $scope.taskStatusList.length;
            var result = [];
            var item = null;

            //console.log("PRINTING ORDER");
            for (i=0; i<len; i++) {
                item = $scope.taskStatusList[i];
                console.log(i + ". " + item.label + " ORDER:" + item.order);
                if (item.order != i) {
                    item.order = i;
                    $scope.taskStatusListSrc.$save(item);
                }
            }
            //console.log("DONE");
        }

        $scope.sortableOptions = {
            connectWith: ".connectTaskStateList",
            stop: function(event, ui) {
                globalSettings.log("settings.controller", "stop", "stop");
                $scope.updateOrder();
            },
            items: "div:not(.last-sortable)"
        };

        function DialogController($scope, $mdDialog, title, link) {
            $scope.title = title;
            $scope.link = link;

            $scope.hide = function() {
              $mdDialog.hide();
            };
        
            $scope.cancel = function() {
              $mdDialog.cancel();
            };
        
            $scope.answer = function(answer) {
              $mdDialog.hide(answer);
            };
        }

        $scope.initAction = function() {
	    	if (globalNav.action == globalNav.ACTION_PREF_FAQ) {
		    	$scope.selectedTabIndex = 2;
	    	} else if (globalNav.action == globalNav.ACTION_PREF_TEAM) {
		    	$scope.selectedTabIndex = 1;
	    	} 
	    	
	    	globalNav.clearAction();
		}
		
		$scope.initAction();

        
    }
}());