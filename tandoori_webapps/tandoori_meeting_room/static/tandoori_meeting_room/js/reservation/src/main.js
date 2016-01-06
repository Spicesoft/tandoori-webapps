
// start the application after onload
$(function () {

    require(["src/App"], function (App) {
        var app = new App();
        app.render();

        // debug
        window.app = app;
    });

});
