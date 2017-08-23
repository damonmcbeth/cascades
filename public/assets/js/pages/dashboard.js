var yimaPage = function() {
    var initilize = function() {        
        if (!Modernizr.mq('(max-width: 1600px)')) {
            {{nav.showTasks()}}
        }
    }

    return {
        init: initilize
    }
}();