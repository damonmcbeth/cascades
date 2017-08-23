(function() {
    //------------------------------------------------------------------
    //[1. Close Search Bar]
    //--
    $('.sidebar.form .header-close').on('click', function() {
        $('.sidebar.form').addClass('collapsed');
    });


    //------------------------------------------------------------------
    //[3. Search Icons]
    //--
    $("#search-input")
        .keyup(function() {
            var term = $.trim(this.value);
            if (term === "") {
                $('.search-results').empty();
            } else {
                $('.search-results').empty();
                $('#all-icons .font-icon-list .font-icon-detail > i[class*="' + term + '"]')
                    .each(function() {
                        var icon = $(this).parent().parent().clone();
                        icon.removeClass('col-md-2 col-sm-3 col-xs-6 col-xs-6').addClass('col-lg-4');
                        $('.search-results').append(icon);
                    });
            }

        });
})();