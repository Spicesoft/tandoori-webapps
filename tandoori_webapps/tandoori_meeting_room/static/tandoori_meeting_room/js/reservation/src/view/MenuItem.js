define([
    "./Base",
    "../util/overloadTemplate",

    "tpl!src/template/menuItem.ejs"
], function (
    BaseView,
    overloadTemplate,

    tplMenuItem
) {
    // check if template if overloaded in html
    tplMenuItem = overloadTemplate("menuItem", tplMenuItem);

    var MenuItem = BaseView.extend({
        tagName: "li", // use dontWrapInLi on container list
        tpl: tplMenuItem,
        renderOnChange: true,

        attributes: {
            tabindex: "-1",
            href: "#"
        },

        getOrTpl: function (prop) {
            var propTpl = this.model.get(prop);

            if (typeof propTpl === "function") {
                return propTpl(this.model.toJSON());
            }
            return propTpl;
        },

        render: function () {
            var data = this.model.toJSON();
            // deal with text template
            data.text = this.getOrTpl("text");
            data.rightText = this.getOrTpl("rightText");

            MenuItem.__super__.render.call(this, data);

            this.$el.removeClass("divider");
            this.$el.removeClass("disabled");

            if (this.model.get("divider")) {
                this.$el.addClass("divider");
                this.$el.empty();
                return this;
            }

            if (this.model.get("disabled")) {
                this.$el.addClass("disabled");
            }

            if (this.model.get("header")) {
                this.$el.addClass("dropdown-header");
            }
        }
    });

    return MenuItem;
});
