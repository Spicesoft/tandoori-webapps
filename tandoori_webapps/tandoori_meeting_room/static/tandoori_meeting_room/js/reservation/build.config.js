/* Build with:
 *
 * cd reservation/
 * r.js -o build.config.js
 */
({
    baseUrl: ".",
    // light version of require to include in the build
    name: "../../../../../tandoori_library/bower_components/almond/almond.js",
    // result of the build
    out: "./dist/reservation.min.js",
    // entry point of the app
    include: ["src/main"],
    // requirejs configuration
    mainConfigFile: "require.config.js",
    paths: {
        // include underscore & backbone in build
        "underscore": "../../../../../tandoori_library/bower_components/underscore/underscore",
        "backbone": "../../../../../tandoori_library/bower_components/backbone/backbone",

        // plugins
        text: "../../../../../tandoori_library/bower_components/requirejs-text/text",
        tpl: "../../../../../tandoori_library/bower_components/requirejs-underscore-tpl/underscore-tpl"
    },
    //optimize: "none",
    wrap: true
})
