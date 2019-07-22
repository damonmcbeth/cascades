(function() {
    'use strict';

    angular
        .module('app')
        .controller('MainController', MainController);

    MainController.$inject = ['$scope', '$state', '$window', '$filter', 'globalSettings', 'globalNav', 
    							'hotkeys', 'fireAuth', 'messageService'];

    function MainController($scope, $state, $window, $filter, globalSettings, globalNav, hotkeys, fireAuth, messageService ) {
        

        $scope.$state = $state;        
        $scope.nav = globalNav;
        $scope.gs = globalSettings;
                
        yima.init();
        
        //if ($window.innerWidth > 1600) {
	    //    $scope.nav.showMyTimeline();
        //}
        
        globalSettings.initSettings().then(
        	function() {				
	        	$scope.initHotKeys();
	        	$scope.initMessaging();
        });
        
        $scope.initMessaging = function() {
	        messageService.requestPermission();
        }
        
        $scope.openJournalDetails = function(pid) {
            $scope.nav.openJournalEditDetails(pid);
        }
                
        $scope.openPersonDetails = function(pid) {
            $scope.nav.openPeopleDetails(pid);
        }
        
        $scope.openProjectDetails = function(projId) {
            $scope.nav.openProjectDetails(projId);
        }
        
        $scope.signOut = function() {
	        fireAuth.$signOut();
        }
        
        $scope.initHotKeys = function() {
	        /*  'backspace', 'tab', 'enter', 'shift', 'ctrl', 'alt',
		        'capslock', 'esc', 'space', 'pageup', 'pagedown', 'end', 'home', 'left',
		        'up', 'right', 'down', 'ins', 'del',
		    */
	        
	        

	        hotkeys.add({ combo: 'alt+t',
			    			description: 'New ' + $scope.gs.currWorkspace.Terminology.taskAlias,
			    			callback: function() {
				    			$scope.nav.newTask();
				    		}
				    	});
			hotkeys.add({ combo: 'alt+j',
			    			description: 'New ' + $scope.gs.currWorkspace.Terminology.memoAlias,
			    			callback: function() {
				    			$scope.nav.newJournalEntry();
				    		}
						});
			hotkeys.add({ combo: 'alt+r',
							description: 'New Reminder',
							callback: function() {
								$scope.nav.newReminder();
							}
						});
			hotkeys.add({ combo: 'alt+p',
							description: 'New ' + $scope.gs.currWorkspace.Terminology.clientAlias,
							callback: function() {
								$scope.nav.newPerson();
							}
						});
			hotkeys.add({ combo: 'alt+o',
							description: 'New ' + $scope.gs.currWorkspace.Terminology.projectAlias,
							callback: function() {
							$scope.nav.newProject();
						}
					});
						
			hotkeys.add({ combo: 'alt+shift+s',
							description: 'Show Summary',
							callback: function() {
							$state.go('mywork.dashboard');
						}
					});
			hotkeys.add({ combo: 'alt+shift+b',
			    			description: 'Show ' + $scope.gs.currWorkspace.Terminology.taskAlias + " board",
			    			callback: function() {
				    			$state.go('mywork.taskboard');
				    		}
				    	});
			hotkeys.add({ combo: 'alt+shift+t',
			    			description: 'Show ' + $scope.gs.currWorkspace.Terminology.taskAliasPlural,
			    			callback: function() {
				    			$scope.nav.showTasks();
				    		}
						});
			hotkeys.add({ combo: 'alt+shift+j',
							description: 'Show ' + $scope.gs.currWorkspace.Terminology.memoAliasPlural,
							callback: function() {
								$state.go('journal.inbox');
							}
						});
			hotkeys.add({ combo: 'alt+shift+r',
							description: 'Show Reminders',
							callback: function() {
								$state.go('mywork.reminders');
							}
						});
			hotkeys.add({ combo: 'alt+shift+p',
							description: 'Show ' + $scope.gs.currWorkspace.Terminology.clientAliasPlural,
							callback: function() {
								$state.go('people.clients');
							}
						});
			hotkeys.add({ combo: 'alt+shift+o',
							description: 'Show ' + $scope.gs.currWorkspace.Terminology.projectAliasPlural,
							callback: function() {
								$state.go('projects.activeprojects');
							}
						});
        }
        
        
    }
}());