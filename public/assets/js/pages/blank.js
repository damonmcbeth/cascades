var yimaPage = function() {
    var initilize = function() {        
        if (!Modernizr.mq('(max-width: 1600px)')) {
            $(".sidebar.form").load(yima.getAssetPath("Partials/chat.html"));
            yima.toggleFormSidebar('Blank');
        }
    }

    return {
        init: initilize
    }
}();