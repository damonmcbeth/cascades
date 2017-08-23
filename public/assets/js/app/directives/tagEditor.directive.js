angular.module('app').directive('tageditor', function() {
	
	var controller = ['$scope', '$mdDialog', '$filter', 'tagService', 'globalNav',
		function($scope, $mdDialog, $filter, tagService, globalNav) {
			
			$scope.populateTags = function() {
		        tagService.getAllTags().then (
			    	function(tags) {			    	
				    	tags.map(function (tag) {
							tag._lowerlabel = tag.label.toLowerCase();
							return tag;
	      				});
	      				
	      				$scope.availTags = $filter('filter')(tags, $scope.filter);
			    	}  
		        )
	        };
	        
	        $scope.populateTags();
	        $scope.selectedItem = null;
			$scope.searchText = null;
	            	
	    	$scope.transformChip = function(chip) {
			    // If it is an object, it's already a known chip
			    if (angular.isObject(chip)) {
			    	return chip;
			    }
			
			    // Otherwise, create a new one
			    return { name: chip, type: 'new' }
		    }
		    
			$scope.querySearch = function(query) {
		    	var results = query ? $scope.availTags.filter($scope.createFilterFor(query)) : [];
				return results;
		    }
		    
		    $scope.createFilterFor = function(query) {
		    	var lowercaseQuery = angular.lowercase(query);
		
				return function filterFn(tag) {
		        	return (tag._lowerlabel.indexOf(lowercaseQuery) > -1);
		      	};
		    }
	    	    
		    $scope.manageTags = function(ev) {
			    globalNav.showTagsPreferences();
			    
			    /*$mdDialog.show({
			      controller: DialogController,
			      templateUrl: 'partials/tagManager.html',
			      parent: angular.element(document.body),
			      targetEvent: ev,
			      clickOutsideToClose:true,
			      fullscreen:true // Only for -xs, -sm breakpoints.
			    })
			    .then(function(answer) {
			      $scope.populateTags();
			    }, function() {
			      $scope.populateTags();
			    });*/
			};
			
			function DialogController($scope, $mdDialog) {
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
    	}
    ];
	
    return {
	    restrict: 'E',
	    scope: { title: '@', model: '=', filter: '=' },
	    controller: controller,
        templateUrl: '/partials/tagEditor.html'
    }
});