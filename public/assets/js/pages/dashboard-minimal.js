var yimaPage = function() {
    var initilize = function() {
        //Chart1
        var d1 = [];
        for (var i = 0; i <= 10; i += 1)
            d1.push([i, parseInt(Math.random() * 30)]);

        var d2 = [];
        for (var i = 0; i <= 10; i += 1)
            d2.push([i, parseInt(Math.random() * 30)]);

        var d3 = [];
        for (var i = 0; i <= 10; i += 1)
            d3.push([i, parseInt(Math.random() * 30)]);

        var data1 = [
            {
                label: "Visits",
                data: d1,
                color: yima._default()
            },
            {
                label: "Sells",
                data: d2,
                color: yima.warning()
            },
            {
                label: "Registers",
                data: d3,
                color: yima.primary()
            }
        ];
    }

    return {
        init: initilize
    }
}();

//jQuery(document).ready(function() {
    //if (yima.isAngular() === false) {
        yimaPage.init();
    //}
//});