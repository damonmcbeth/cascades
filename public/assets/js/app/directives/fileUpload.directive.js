angular.module('app').directive('fileUpload', function() {
	return {
    	restrict: "E",
		transclude: true,
		scope: { onChange: "=", loc: "@", ctrl: "="},
		template: '<input type="file" id="file-upload-btn" name="file"/><label><ng-transclude></ng-transclude></label>',
		link: function (scope, element, attrs) {
				element.bind("change", function () {
					var loc = scope.loc == "A" ? "Avatars" : "Files";
					scope.onChange(loc, element.children()[0].files, scope.ctrl);
      		});
    	}
  	}
    
});