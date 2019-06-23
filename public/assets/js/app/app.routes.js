(function() {
    'use strict';

    angular
        .module("app")
        .config(routeConfig);

    function routeConfig($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise("/mywork/dashboard")

        $stateProvider.state('unauthorized', {
	        	url: "/unauthorized",
                templateUrl: "/Error401.html",
                ncyBreadcrumb: {
                    label: 'Cascades'
                },
                data: {
                    //icon: 'pe-7s-id',
                    hasFullContainer: true,
                }
            })
            .state('mywork', {
                abstract: true,
                template: "<ui-view/>",
                ncyBreadcrumb: {
                    label: '{{currName}}'
                },
                data: {
                    //icon: 'pe-7s-id',
                },
                resolve: {
	                
                }
            })
            .state('mywork.dashboard', {
                url: "/mywork/dashboard",
                templateUrl: 'views/Dashboard.html',
                controller: 'DashboardController',
                ncyBreadcrumb: {
                    label: 'Summary'
                },
                data: {
                    //icon: 'pe-7s-display1',
                },
                resolve: {
	                //currentAuth: ["Auth", function(Auth) {
					//	return Auth.$requireSignIn();
        			//}],
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
	                                'assets/js/lib/easypiechart/jquery.easypiechart.min.js',
                                    'assets/js/lib/easypiechart/easypiechart-init.js',
                                    'assets/js/pages/dashboard.js',
                                ]
                            });
                        }
                    ]
                }
            })
            .state('mywork.taskboard', {
                url: "/mywork/taskboard/:id",
                templateUrl: 'views/Taskboard.html',
                controller: 'TaskboardController',
                ncyBreadcrumb: {
                    label: '{{taskAlias}} board'
                },
                data: {
                    //icon: 'pe-7s-note2',
                    hasFullContainerHorz: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/pages/blank.js',
                                ]
                            });
                        }
                    ]
                }
            })
            .state('mywork.reminders', {
                url: "/mywork/reminders",
                templateUrl: 'views/Reminders.html',
                controller: 'RemindersController',
                ncyBreadcrumb: {
                    label: 'Calendar'
                },
                data: {
                    //icon: 'pe-7s-note2',
                    hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    //'assets/js/lib/fullcalendar/moment.min.js',
                                    'assets/js/lib/fullcalendar/jquery-ui.custom.min.js',
                                    'assets/js/lib/fullcalendar/3.4.0/fullcalendar.js',
                                ]
                            });
                        }
                    ]
                }
            })
            .state('mywork.ideas', {
	            url: "/mywork/ideas",
                templateUrl: 'views/Journal.html',
                controller: 'JournalController',
                params: { display: 'Ideas' },
                ncyBreadcrumb: {
                    label: 'Ideas'
                },
                data: {
                    //icon: 'pe-7s-note2',
                    hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/pages/blank.js',
                                ]
                            });
                        }
                    ]
                }
            })
			

            .state('mywork.org', {
                url: "/mywork/org",
                templateUrl: 'views/Organization.html',
                ncyBreadcrumb: {
                    label: 'Workspace'
                },
                data: {
                    //icon: 'pe-7s-note2',
                    //hasFullContainerHorz: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/lib/sparkline/jquery.sparkline.min.js',
                                    //'assets/js/lib/sparkline/sparkline-init.js'
                                ]
                            });
                        }
                    ]
                }
            })
            .state('mywork.insights', {
                url: "/mywork/insights",
                templateUrl: 'views/Insights.html',
                ncyBreadcrumb: {
                    label: 'Insights'
                },
                data: {
                    //icon: 'pe-7s-light',
                    //hasFullContainerHorz: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/lib/sparkline/jquery.sparkline.min.js',
                                    //'assets/js/lib/sparkline/sparkline-init.js'
                                ]
                            });
                        }
                    ]
                }
            })
            
            .state('mywork.tickets', {
                url: "/mywork/tickets",
                templateUrl: 'views/Tickets.html',
                controller: 'TicketsController',
                ncyBreadcrumb: {
                    label: 'Tickets'
                },
                data: {
                    //icon: 'pe-7s-light',
                    hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/lib/sparkline/jquery.sparkline.min.js',
                                    //'assets/js/lib/sparkline/sparkline-init.js'
                                ]
                            });
                        }
                    ]
                }
            })
            
            .state('mywork.team', {
                url: "/mywork/team",
                params: { display: 'Team' },
                templateUrl: 'views/Clients.html',
                controller: 'ClientsController',
                ncyBreadcrumb: {
                    label: 'Team members'
                },
                data: {
                    hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/pages/blank.js',
                                ]
                            });
                        }
                    ]
                }
            })

            .state('support', {
                abstract: true,
                template: "<ui-view/>",
                ncyBreadcrumb: {
                    label: 'Support'
                },
                data: {
                    //icon: 'pe-7s-id',
                },
                resolve: {
	                
                }
            })
            .state('support.welcome', {
	            url: "/support/welcome",
                templateUrl: 'views/Support.html',
                ncyBreadcrumb: {
                    label: 'Welcome'
                },
                data: {
                    hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/pages/blank.js',
                                ]
                            });
                        }
                    ]
                }
            })



            .state('inbox', {
                url: "/inbox",
                templateUrl: 'views/Inbox.html',
                ncyBreadcrumb: {
                    label: 'Mail'
                },
                data: {
                    icon: 'pe-7s-mail"',
                    hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/lib/summernote/summernote.min.js',
                                    'assets/js/pages/inbox.js',
                                ]
                            });
                        }
                    ]
                }
            })
            .state('calendar', {
                abstract: true,
                template: "<ui-view/>",
                ncyBreadcrumb: {
                    label: 'Timeline'
                },
                data: {
                    //icon: 'pe-7s-id',
                },
                resolve: {
	                
                }
            })
            .state('calendar.today', {
                url: "/calendar/today",
                params: { rng: 'today' },
                templateUrl: 'views/Timeline.html',
                controller: 'TimelineController',
                ncyBreadcrumb: {
                    label: 'Today'
                },
                data: {
                    hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/pages/blank.js',
                                ]
                            });
                        }
                    ]
                }
            })
            .state('calendar.yesterday', {
                url: "/calendar/yesterday",
                params: { rng: 'yesterday' },
                templateUrl: 'views/Timeline.html',
                controller: 'TimelineController',
                ncyBreadcrumb: {
                    label: 'Today'
                },
                data: {
                    hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/pages/blank.js',
                                ]
                            });
                        }
                    ]
                }
            })
            .state('calendar.last7', {
                url: "/calendar/last7",
                params: { rng: 'last7' },
                templateUrl: 'views/Timeline.html',
                controller: 'TimelineController',
                ncyBreadcrumb: {
                    label: 'Last 7 days'
                },
                data: {
                    hasFullContainer: true,
                },
                resolve: {
                    
                }
            })
            .state('calendar.last14', {
                url: "/calendar/last14",
                params: { rng: 'last14' },
                templateUrl: 'views/Timeline.html',
                controller: 'TimelineController',
                ncyBreadcrumb: {
                    label: 'Last 14 days'
                },
                data: {
                    hasFullContainer: true,
                },
                resolve: {
                    
                }
            })
            .state('calendar.last30', {
                url: "/calendar/last30",
                params: { rng: 'last30' },
                templateUrl: 'views/Timeline.html',
                controller: 'TimelineController',
                ncyBreadcrumb: {
                    label: 'Last 30 days'
                },
                data: {
                    hasFullContainer: true,
                },
                resolve: {
                    
                }
            })
            .state('calendar.last60', {
                url: "/calendar/last60",
                params: { rng: 'last60' },
                templateUrl: 'views/Timeline.html',
                controller: 'TimelineController',
                ncyBreadcrumb: {
                    label: 'Last 60 days'
                },
                data: {
                    hasFullContainer: true,
                },
                resolve: {
                    
                }
            })
            .state('calendar.custom', {
                url: "/calendar/custom",
                params: { rng: 'custom' },
                templateUrl: 'views/Timeline.html',
                controller: 'TimelineController',
                ncyBreadcrumb: {
                    label: 'Custom'
                },
                data: {
                    hasFullContainer: true,
                },
                resolve: {
                    
                }
            })

            .state('profile', {
                url: "/profile",
                templateUrl: 'views/Profile.html',
                controller: "ProfileController",
                ncyBreadcrumb: {
                    label: 'Profile'
                },
                data: {
                    icon: 'pe-7s-id',
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    {
                                        type: 'js',
                                        path: '//maps.google.com/maps/api/js?sensor=true&callback=initialize'
                                    },
                                    'assets/js/lib/gmaps/gmaps.min.js',
                                    'assets/js/pages/profile.js',
                                    'assets/js/app/controllers/profile.controller.js',
                                ]
                            });
                        }
                    ]
                }
            })
            .state('pages', {
                abstract: true,
                template: '<ui-view/>',
                ncyBreadcrumb: {
                    label: 'Pages'
                },
                data: {
                    icon: 'pe-7s-display1',
                },
            })
            .state('pages.timeline', {
                url: "/pages/timeline",
                templateUrl: 'views/Timeline.html',
                ncyBreadcrumb: {
                    label: 'Timeline'
                },
                data: {
                    icon: 'pe-7s-clock',
                },
            })
            .state('pages.error500', {
                url: "/pages/error500",
                templateUrl: 'views/Error500.html',
                ncyBreadcrumb: {
                    label: '500'
                },
                data: {
                    icon: 'pe-7s-server',
                },
            })
            .state('pages.error404', {
                url: "/pages/error404",
                templateUrl: 'views/Error404.html',
                ncyBreadcrumb: {
                    label: '404'
                },
                data: {
                    icon: 'pe-7s-attention',
                },
            })
            .state('pages.error401', {
                url: "/pages/error401",
                templateUrl: 'views/Error401.html',
                ncyBreadcrumb: {
                    label: '401'
                },
                data: {
                    icon: 'pe-7s-user',
                },
            })
            .state('pages.blank', {
                url: "/pages/blank",
                templateUrl: 'views/Blank.html',
                ncyBreadcrumb: {
                    label: 'Blank Page'
                },
                data: {
                    icon: 'pe-7s-browser',
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/pages/blank.js',
                                ]
                            });
                        }
                    ]
                }
            })
            .state('projects', {
                abstract: true,
                template: '<ui-view/>',
                ncyBreadcrumb: {
                    label: '{{projAliasPlural}}'
                },
                data: {
                    //icon: 'pe-7s-portfolio',
                },
                
            })
            
            .state('mywork.myprojects', {
                url: "/mywork/myprojects",
                params: { display: 'My',
	                cardView: true },
                templateUrl: 'views/Projects.html',
                controller: 'ProjectController',
                ncyBreadcrumb: {
                    label: '{{projAliasPlural}}'
                },
                data: {
	                hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/pages/blank.js',
                                ]
                            });
                        }
                    ]
                }
            })
            
            .state('projects.reminders', {
                url: "/projects/reminders",
                templateUrl: 'views/Reminders.html',
                controller: 'RemindersController',
                ncyBreadcrumb: {
                    label: 'Reminders'
                },
                data: {
                    hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/lib/fullcalendar/jquery-ui.custom.min.js',
                                    'assets/js/lib/fullcalendar/3.4.0/fullcalendar.js',
                                ]
                            });
                        }
                    ]
                }
            })
            
            .state('projects.activeprojects', {
                url: "/projects/activeprojects",
                params: { display: 'Active',
	                cardView: false },
                templateUrl: 'views/Projects.html',
                controller: 'ProjectController',
                ncyBreadcrumb: {
                    label: 'Active {{projAliasPlural}}'
                },
                data: {
	                hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/pages/blank.js',
                                    'assets/js/lib/easypiechart/jquery.easypiechart.min.js',
                                    'assets/js/lib/easypiechart/easypiechart-init.js',
                                ]
                            });
                        }
                    ]
                }
            })
            
            .state('projects.doneprojects', {
                url: "/projects/doneprojects",
                params: { display: 'Completed',
	                cardView: false },
                templateUrl: 'views/Projects.html',
                controller: 'ProjectController',
                ncyBreadcrumb: {
                    label: 'Completed {{projAliasPlural}}'
                },
                data: {
	                hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/pages/blank.js',
                                ]
                            });
                        }
                    ]
                }
            })

            .state('projects.taskboard', {
                url: "/projects/taskboard/:id",
                templateUrl: 'views/ProjectTaskboard.html',
                controller: 'ProjectTaskboardController',
                ncyBreadcrumb: {
                    label: '{{taskAlias}} board'
                },
                data: {
                    //icon: 'pe-7s-note2',
                    hasFullContainerHorz: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/pages/blank.js',
                                ]
                            });
                        }
                    ]
                }
            })
            
            .state('journal', {
                abstract: true,
                template: '<ui-view/>',
                ncyBreadcrumb: {
                    label: '{{memoAliasPlural}}'
                },
                data: {
                    //icon: 'pe-7s-portfolio',
                },
                
            })


            .state('journal.inbox', {
                url: "/journal",
                params: { display: 'Inbox' },
                templateUrl: 'views/Journal.html',
                controller: 'JournalController',
                ncyBreadcrumb: {
                    label: '{{memoAliasPlural}} Inbox'
                },
                data: {
                    hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/lib/summernote/summernote.min.js'
                                ]
                            });
                        }
                    ]
                }
            })
            
            .state('mywork.myjournal', {
                url: "/mywork/myjournal",
                params: { display: 'My' },
                templateUrl: 'views/Journal.html',
                controller: 'JournalController',
                ncyBreadcrumb: {
                    label: '{{memoAliasPlural}}'
                },
                data: {
	                hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/pages/blank.js',
                                ]
                            });
                        }
                    ]
                }
            })
            
            .state('journal.archived', {
                url: "/journal/archived",
                params: { display: 'Archived' },
                templateUrl: 'views/Journal.html',
                controller: 'JournalController',
                ncyBreadcrumb: {
                    label: 'Archived {{memoAliasPlural}}'
                },
                data: {
	                hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/pages/blank.js',
                                ]
                            });
                        }
                    ]
                }
            })
            
            .state('people', {
                abstract: true,
                template: '<ui-view/>',
                ncyBreadcrumb: {
                    label: 'People'
                },
                data: {
                    //icon: 'pe-7s-users',
                },
            })
            .state('people.activeclients', {
                url: "/people/activeclients",
                params: { display: 'Active' },
                templateUrl: 'views/Clients.html',
                controller: 'ClientsController',
                ncyBreadcrumb: {
                    label: 'Active {{clientAliasPlural}}'
                },
                data: {
	                hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/pages/blank.js',
                                ]
                            });
                        }
                    ]
                }
            })
            .state('people.team', {
                url: "/people/team",
                params: { display: 'Team' },
                templateUrl: 'views/Clients.html',
                controller: 'ClientsController',
                ncyBreadcrumb: {
                    label: 'Team members'
                },
                data: {
                    hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/pages/blank.js',
                                ]
                            });
                        }
                    ]
                }
            })

            
            .state('people.clients', {
                url: "/people/clients",
                params: { display: 'All' },
                templateUrl: 'views/Clients.html',
                controller: 'ClientsController',
                ncyBreadcrumb: {
                    label: 'All {{clientAliasPlural}}'
                },
                data: {
	                hasFullContainer: true,
                },
                resolve: {
                    deps: [
                        '$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                serie: true,
                                files: [
                                    'assets/js/pages/blank.js',
                                ]
                            });
                        }
                    ]
                }
            })

    }
}());