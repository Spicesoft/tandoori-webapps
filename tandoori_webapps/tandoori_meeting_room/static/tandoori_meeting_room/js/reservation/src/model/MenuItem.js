define([
    "backbone"
], function (
    Backbone
) {
    var MenuItem = Backbone.Model.extend({
        defaults: {
            text: gettext("Menu item"),
            rightText: "",
            label: null, // {text: "label", type: "primary"}
            divider: false,
            disabled: false,
            header: false
        }
    });

    return MenuItem;
});
