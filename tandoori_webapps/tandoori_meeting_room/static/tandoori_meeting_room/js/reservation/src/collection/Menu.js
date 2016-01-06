define([
    "backbone",

    "../model/MenuItem"
], function (
    Backbone,

    MenuItem
) {
    var Menu = Backbone.Collection.extend({
        model: MenuItem
    });

    return Menu;
});
