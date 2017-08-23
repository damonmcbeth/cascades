//------------------------------------------------------------------
//[Landing Page JavaScript Structure]

//Project:	Yima Admin App
//Version:	1.0.0
//Last change:	8/5/16 [Changelog: (http://www.IssatisLab.com)]
//Implemented By:	IssatisLab (http://www.IssatisLab.com)


//[Table of contents]

// Devive Animations
// Testimonials Slider
// Tooltip
// Navigation Toggle
// Scroll To
// Smooth Scrolling
// Map
//-------------------------------------------------------------------

var yima = function () {
    return {
        init: function () {
            //------------------------------------------------------------------
            //[Device Animations]
            //--
            $('.wp1').waypoint(function () {
                $('.wp1').addClass('animated fadeInUp');
            }, {
                offset: '75%'
            });
            $('.wp2').waypoint(function () {
                $('.wp2').addClass('animated fadeInUp');
            }, {
                offset: '75%'
            });
            $('.wp3').waypoint(function () {
                $('.wp3').addClass('animated fadeInRight');
            }, {
                offset: '75%'
            });

            //------------------------------------------------------------------
            //[Testimonials Slider]
            //--
            $('.flexslider').flexslider({
                animation: "slide"
            });

            //------------------------------------------------------------------
            //[Tooltip]
            //--
            $('[data-toggle="tooltip"]').tooltip();


            //------------------------------------------------------------------
            //[Navigation Toggle]
            //--
            $('.nav-toggle').click(function () {
                $(this).toggleClass('active');
                $('.header-nav').toggleClass('open');
                event.preventDefault();
            });
            $('.header-nav li a').click(function () {
                $('.nav-toggle').toggleClass('active');
                $('.header-nav').toggleClass('open');

            });

            //------------------------------------------------------------------
            //[Scroll To]
            //--
            $(window).scroll(function () {
                var scroll = $(window).scrollTop();

                if (scroll >= 20) {
                    $('div.navigation').addClass('fixed');
                    $('.header').css({
                        "padding": "28px 0 26px"
                    });
                    $('.header .member-actions').css({
                        "top": "32px",
                    });
                    $('.header .navicon').css({
                        "top": "34px",
                    });
                } else {
                    $('div.navigation').removeClass('fixed');
                    $('.header').css({
                        "padding": "40px 0 30px"
                    });
                    $('.header .member-actions').css({
                        "top": "41px",
                    });
                    $('.header .navicon').css({
                        "top": "48px",
                    });
                }
            });

            //------------------------------------------------------------------
            //[Smooth Scrolling]
            //--
            $('a[href*=#]:not([href=#])').click(function () {
                if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && location.hostname === this.hostname) {

                    var target = $(this.hash);
                    target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
                    if (target.length) {
                        $('html,body').animate({
                            scrollTop: target.offset().top
                        }, 2000);
                        return false;
                    }
                }
            });

            //------------------------------------------------------------------
            //[Map]
            //--
            var markerMap = new GMaps({
                el: '#map',
                lat: 51.5144592,
                lng: -0.1764484,
                zoomControl: false,
                scrollwheel: false,
                navigationControl: false,
                mapTypeControl: false,
                scaleControl: false,
                streetViewControl: false,
                draggable: false
            });
            markerMap.addMarker({
                lat: 51.5144592,
                lng: -0.1764484,
                title: 'London',
                details: {
                    database_id: 42,
                    author: 'IssatisLab'
                },
                click: function (e) {
                    if (console.log)
                        console.log(e);
                },
                mouseover: function (e) {
                    if (console.log)
                        console.log(e);
                }
            });
            var styles = [
                {
                    "featureType": "all",
                    "elementType": "labels.text.fill",
                    "stylers": [
                        {
                            "saturation": 36
                        },
                        {
                            "color": "#000000"
                        },
                        {
                            "lightness": 40
                        }
                    ]
                },
                {
                    "featureType": "all",
                    "elementType": "labels.text.stroke",
                    "stylers": [
                        {
                            "visibility": "on"
                        },
                        {
                            "color": "#000000"
                        },
                        {
                            "lightness": 5
                        }
                    ]
                },
                {
                    "featureType": "all",
                    "elementType": "labels.icon",
                    "stylers": [
                        {
                            "visibility": "off"
                        }
                    ]
                },
                {
                    "featureType": "administrative",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "color": "#000000"
                        },
                        {
                            "lightness": 20
                        }
                    ]
                },
                {
                    "featureType": "administrative",
                    "elementType": "geometry.stroke",
                    "stylers": [
                        {
                            "color": "#000000"
                        },
                        {
                            "lightness": 17
                        },
                        {
                            "weight": 1.2
                        }
                    ]
                },
                {
                    "featureType": "landscape",
                    "elementType": "geometry",
                    "stylers": [
                        {
                            "color": "#000000"
                        },
                        {
                            "lightness": 20
                        }
                    ]
                },
                {
                    "featureType": "poi",
                    "elementType": "geometry",
                    "stylers": [
                        {
                            "color": "#000000"
                        },
                        {
                            "lightness": 21
                        }
                    ]
                },
                {
                    "featureType": "road.highway",
                    "elementType": "geometry.fill",
                    "stylers": [
                        {
                            "color": "#000000"
                        },
                        {
                            "lightness": 17
                        }
                    ]
                },
                {
                    "featureType": "road.highway",
                    "elementType": "geometry.stroke",
                    "stylers": [
                        {
                            "color": "#000000"
                        },
                        {
                            "lightness": 29
                        },
                        {
                            "weight": 0.2
                        }
                    ]
                },
                {
                    "featureType": "road.arterial",
                    "elementType": "geometry",
                    "stylers": [
                        {
                            "color": "#000000"
                        },
                        {
                            "lightness": 18
                        }
                    ]
                },
                {
                    "featureType": "road.local",
                    "elementType": "geometry",
                    "stylers": [
                        {
                            "color": "#000000"
                        },
                        {
                            "lightness": 16
                        }
                    ]
                },
                {
                    "featureType": "transit",
                    "elementType": "geometry",
                    "stylers": [
                        {
                            "color": "#000000"
                        },
                        {
                            "lightness": 19
                        }
                    ]
                },
                {
                    "featureType": "water",
                    "elementType": "geometry",
                    "stylers": [
                        {
                            "color": "#000000"
                        },
                        {
                            "lightness": 17
                        }
                    ]
                }
            ];

            markerMap.addStyle({
                styledMapName: "Styled Map",
                styles: styles,
                mapTypeId: "map_style"
            });

            markerMap.setStyle("map_style");
        }
    }
}();


jQuery(document).ready(function () {
    yima.init();
});