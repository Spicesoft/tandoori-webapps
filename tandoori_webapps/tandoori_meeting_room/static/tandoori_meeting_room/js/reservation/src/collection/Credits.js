define([
    "backbone",

    "../model/Credit"
], function (
    Backbone,

    Credit
) {
    var Credits = Backbone.Collection.extend({
        model: Credit
    });

    return Credits;
});
