define([
    "underscore",
    "backbone"
], function (
    _,
    Backbone
) {
    var Base = Backbone.View.extend({
        tpl: _.template(""),
        initialize: function (options) {
            Base.__super__.initialize.apply(this, arguments);
            this.options = options;
            if (this.model && (this.renderOnChange || options.renderOnChange)) {
                this.model.on("change", function () {
                    this.render();
                }, this);
            }
        },
        render: function (data) {
            if (!data && this.model) {
                data = this.model.toJSON();
            }
            data = data || this.data || {};
            data.model = this.model;
            var html = this.tpl(data);
            this.$el.html(html);

            this.rendered = true;
            return this;
        }
    });

    return Base;
});
