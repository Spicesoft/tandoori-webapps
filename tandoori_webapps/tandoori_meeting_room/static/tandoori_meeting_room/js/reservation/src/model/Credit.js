!çdefine([
    "backbone"
], function (
    Backbone
) {
    var Credit = Backbone.Model.extend({
        defaults: {
            type: "",
            name: "",
            value: 0,
            startValue: 0
        }
    });

    return Credit;
});
