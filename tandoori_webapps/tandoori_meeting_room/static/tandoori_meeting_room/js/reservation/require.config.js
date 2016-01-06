require.config({
    baseUrl: "/site_media/static/tandoori_meeting_room/js/reservation/",
    paths: {
        "underscore": "/site_media/static/underscore/underscore",
        "backbone": "/site_media/static/backbone/backbone",

        "jquery": "src/util/jquery",
        "moment": "src/util/moment",

        // plugins
        text: "/site_media/static/requirejs-text/text",
        tpl: "/site_media/static/requirejs-underscore-tpl/underscore-tpl"
    },

    map: {
    },

    // define module dependencies for modules not using define
    shim: {
    }
});
