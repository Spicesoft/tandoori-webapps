define([
    "./Base",
    "../util/overloadTemplate",

    "tpl!src/template/availableCredits.ejs"
], function (
    BaseView,
    overloadTemplate,

    tplAvailableCredits
) {
    // check if template if overloaded in html
    tplAvailableCredits = overloadTemplate("availableCredits", tplAvailableCredits);

    var Credit = BaseView.extend({
        tpl: tplAvailableCredits,
        renderOnChange: true
    });

    return Credit;
});
