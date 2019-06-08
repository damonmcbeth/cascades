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
	        
	        hotkeys.add({ combo: 'ctrl+d',
			    			description: 'Show Desktop',
			    			callback: function() {
				    			$state.go('mywork.dashboard');
				    		}
				    	});

	        hotkeys.add({ combo: 'ctrl+t',
			    			description: 'New ' + $scope.gs.currWorkspace.Terminology.taskAlias,
			    			callback: function() {
				    			$scope.nav.newTask();
				    		}
				    	});
			hotkeys.add({ combo: 'alt+t',
			    			description: 'Show ' + $scope.gs.currWorkspace.Terminology.taskAliasPlural,
			    			callback: function() {
				    			$scope.nav.showTasks();
				    		}
				    	});
			hotkeys.add({ combo: 'ctrl+b',
			    			description: 'Show ' + $scope.gs.currWorkspace.Terminology.taskAlias + " board",
			    			callback: function() {
				    			$state.go('mywork.taskboard');
				    		}
				    	});
			hotkeys.add({ combo: 'ctrl+p',
			    			description: 'Show ' + $scope.gs.currWorkspace.Terminology.clientAliasPlural,
			    			callback: function() {
				    			$scope.nav.showPeople();
				    		}
				    	});
        }
        
        
    }
}());