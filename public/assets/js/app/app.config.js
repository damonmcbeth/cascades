(function() {
    'use strict';

    var app = angular.module('app');
    
    //var config = {
	//    	apiKey: "AIzaSyDesh4UPgrqBiB80p777aeeRSDd_N2geJA",
	//	    authDomain: "temporal-potion-575.firebaseapp.com",
	//	    databaseURL: "https://temporal-potion-575.firebaseio.com",
	//	    storageBucket: "temporal-potion-575.appspot.com",
	//	    messagingSenderId: "251993041995"
    //};
    //firebase.initializeApp(config);
    	
    app.run(function($rootScope, $timeout) {
        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
            $rootScope.hasFullContainer = toState.data.hasFullContainer;
            $rootScope.hasFullContainerHorz = toState.data.hasFullContainerHorz;
            
            if (toState.ncyBreadcrumb && toState.ncyBreadcrumb.label) {
	            var tmp = toState.ncyBreadcrumb.label;
	            
	            if ($rootScope.orgPref != null) {	
		        	tmp = tmp.replace("{{projAliasPlural}}", $rootScope.orgPref.projectAliasPlural);  
		        	tmp = tmp.replace("{{clientAliasPlural}}", $rootScope.orgPref.clientAliasPlural);
		        	tmp = tmp.replace("{{taskAliasPlural}}", $rootScope.orgPref.taskAliasPlural);
		        	tmp = tmp.replace("{{taskAlias}}", $rootScope.orgPref.taskAlias); 
		        	tmp = tmp.replace("{{memoAliasPlural}}", $rootScope.orgPref.memoAliasPlural);
		        	tmp = tmp.replace("{{memoAlias}}", $rootScope.orgPref.memoAlias);
	            }
	            
                $rootScope.pageTitle = tmp;
            }
        });
    });
    
	app.run(["$rootScope", "$state", function($rootScope, $state) {
		$rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
		    if (error === "AUTH_REQUIRED") {
		      $state.go("unauthorized");
		    }
		});
	}]);

    app.config(function($breadcrumbProvider) {
        $breadcrumbProvider.setOptions({
            templateUrl: 'templates/breadcrumb.html',
            includeAbstract: true,
        });
    });
    
    app.config(function($mdThemingProvider) {
	  	$mdThemingProvider.theme("success-toast");
	  	$mdThemingProvider.theme("error-toast");
	  	$mdThemingProvider.theme("info-toast");
	  	$mdThemingProvider.theme("default-toast");
	});
    
    /*app.config(function($firebaseRefProvider) {
	    $firebaseRefProvider.registerUrl({
		    default: config.databaseURL,
		    users: config.databaseURL + '/Users'
	    });
    })
    
    app.factory("fireFactory", ["$firebaseObject", "$firebaseRef",
    	function($firebaseObject, $firebaseRef) {
	    	return $firebaseObject($firebaseRef.users);
    	}
    ])*/
    
    app.factory("fireAuth", ["$firebaseAuth",
		function($firebaseAuth) {
		    return $firebaseAuth();
		}
	]);

	app.config(['$qProvider', function ($qProvider) {
		$qProvider.errorOnUnhandledRejections(false);
	}]);
    
    
}());