define([
    "jquery",

    "./Base"
], function (
    $,

    BaseView
) {
    var List = BaseView.extend({
        tagName: "ul",
        animate: true,
        initialize: function (options) {
            List.__super__.initialize.apply(this, arguments);
            this.collection.on("add", this.addItem, this);
            this.collection.on("remove", this.removeItem, this);
            this.collection.on("sort", this.sortItems, this);
            this.collection.on("reset", this.reset, this);
            if (!this.getItemView && !options.getItemView) {
                throw new Error("Missing option: getItemView()");
            }
        },
        reset: function () {
            this.$el.empty();
            this.animate = false;
            this.render();
            this.animate = true;
        },
        render: function () {
            // do not call super
            this.rendered = true;
            this.collection.each(this.addItem, this);
            return this;
        },
        modelFromEl: function (el) {
            // check if the el is contained in this DOM tree
            if (!$.contains(this.el, el)) {
                return;
            }
            // find <li> ancestor
            var $li = $(el).parents("li").first();
            // check if element is being removed
            if ($li.hasClass("js-removing")) {
                return;
            }
            var index = $li.index();
            return this.collection.at(index);
        },
        addItem: function (item) {
            if (this.rendered) {
                var view = (this.getItemView || this.options.getItemView)(item);
                item.view = view;
                view.render();
                // wrap in an <li>, append to <ul>
                var $li;
                if (this.options.dontWrapInLi) {
                    $li = view.$el;
                }
                else {
                    $li = $("<li>").append(view.$el);
                }
                if (this.animate) {
                    $li.hide().appendTo(this.$el);
                    this.sortItems();
                    $li.slideDown();
                }
                else {
                    $li.appendTo(this.$el);
                    this.sortItems();
                }
            }
        },
        removeItem: function (item, collection, options) {
            var index = options.index;
            delete item.view;
            var $li = this.$el.children("li").eq(index);
            if (this.animate) {
                $li.addClass("js-removing")
                    .slideUp(function () {
                        $(this).remove();
                    });
            }
            else {
                $li.remove();
            }
        },
        sortItems: function () {
            var $list = this.$el;
            this.collection.each(function (model, index) {
                if (model.view) {
                    var $li = model.view.$el.parent();
                    $li.appendTo($list);
                }
            });
        }
    });

    return List;
});
